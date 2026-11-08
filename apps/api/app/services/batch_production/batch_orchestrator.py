import asyncio
import json
import logging
import queue
import re
import threading
import uuid
import zipfile
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from app.schemas.batch_production import (
    BatchDetailResponse,
    BatchExportZipResponse,
    BatchPreflightProductItem,
    BatchPreflightResponse,
    BatchProductEligibilityStatus,
    BatchProductionGroup,
    BatchProductionStatus,
    CreateBatchProductionRequest,
    FinalVideoItem,
    FinalVideoLibraryResponse,
)
from app.schemas.replacements import (
    CreateReplacementJobRequest,
    ReplacementJobResponse,
    ReplacementJobStatus,
    UserDecision,
)
from app.services.garment_engine import local_garment_pipeline
from app.services.garment_engine.pipeline import (
    _REPLACEMENT_JOBS_DB,
    _save_jobs_db,
)
from app.core.config import settings
from app.services.personalization import _GENERATIONS_DB, _PROJECTS_DB
from app.services.product_extraction import _PRODUCT_ASSETS_DB
from app.services.storage import storage_service

logger = logging.getLogger(__name__)

_BATCH_DB_PATH = settings.storage_root_path.parent / "db" / "batch_production_groups.json"
_BATCH_GROUPS_DB: dict[str, dict[str, Any]] = {}
_IDEMPOTENCY_CACHE: dict[str, str] = {}  # idempotency_key -> batch_id


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def _load_batch_db() -> None:
    global _BATCH_GROUPS_DB, _IDEMPOTENCY_CACHE
    if _BATCH_DB_PATH.is_file():
        try:
            with open(_BATCH_DB_PATH, encoding="utf-8") as f:
                data = json.load(f)
                _BATCH_GROUPS_DB = data.get("batches", {})
                _IDEMPOTENCY_CACHE = data.get("idempotency_cache", {})
        except Exception as e:
            logger.warning("Could not load batch_production_groups.json: %s", e)
            _BATCH_GROUPS_DB = {}
            _IDEMPOTENCY_CACHE = {}


def _save_batch_db() -> None:
    try:
        _BATCH_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(_BATCH_DB_PATH, "w", encoding="utf-8") as f:
            json.dump(
                {
                    "batches": _BATCH_GROUPS_DB,
                    "idempotency_cache": _IDEMPOTENCY_CACHE,
                },
                f,
                indent=2,
                ensure_ascii=False,
            )
    except Exception as e:
        logger.error("Failed to save batch_production_groups.json: %s", e)


_load_batch_db()


class BatchProductionOrchestrator:
    """
    Coordinates multi-product batch video production using the local Garment Replacement Engine.
    Executes child jobs in a controlled sequential queue to guarantee CPU/GPU memory safety.
    """

    def __init__(self):
        self._work_queue: queue.Queue[tuple[str, str]] = queue.Queue()  # (batch_id, job_id)
        self._worker_thread: threading.Thread | None = None
        self._is_worker_running = False
        self._worker_lock = threading.Lock()
        self._archived_videos: set[str] = set()
        self._ensure_worker()
        self._resume_pending_jobs()

    def _resume_pending_jobs(self) -> None:
        """Resumes any pending jobs from uncompleted batches upon startup."""
        for batch_id, batch_rec in _BATCH_GROUPS_DB.items():
            if batch_rec.get("status") in (BatchProductionStatus.QUEUED.value, BatchProductionStatus.PROCESSING.value):
                for job_id in batch_rec.get("job_ids", []):
                    j = _REPLACEMENT_JOBS_DB.get(job_id)
                    if j and j.get("status") == ReplacementJobStatus.PENDING.value:
                        self._work_queue.put((batch_id, job_id))

    def _ensure_worker(self) -> None:
        with self._worker_lock:
            if not self._is_worker_running or not self._worker_thread or not self._worker_thread.is_alive():
                self._is_worker_running = True
                self._worker_thread = threading.Thread(
                    target=self._queue_worker_loop,
                    name="BatchProductionQueueWorker",
                    daemon=True,
                )
                self._worker_thread.start()

    def _queue_worker_loop(self) -> None:
        """
        Background single-worker loop processing child replacement jobs one-by-one.
        Guarantees zero GPU VRAM overflow by enforcing strictly sequential execution.
        """
        logger.info("BatchProductionQueueWorker started")
        while self._is_worker_running:
            try:
                batch_id, job_id = self._work_queue.get(timeout=2.0)
            except queue.Empty:
                continue

            try:
                self._process_single_job(batch_id, job_id)
            except Exception as e:
                logger.error("Error processing queued job %s in batch %s: %s", job_id, batch_id, e)
                job_rec = _REPLACEMENT_JOBS_DB.get(job_id)
                if job_rec:
                    job_rec["status"] = ReplacementJobStatus.FAILED.value
                    job_rec["error_code"] = "BATCH_EXECUTION_ERROR"
                    job_rec["error_message"] = str(e)
                    job_rec["current_step"] = f"Lỗi thực thi: {e}"
                    _save_jobs_db()
                self._recalculate_batch_status(batch_id)
            finally:
                self._work_queue.task_done()

    def _process_single_job(self, batch_id: str, job_id: str) -> None:
        batch_rec = _BATCH_GROUPS_DB.get(batch_id)
        job_rec = _REPLACEMENT_JOBS_DB.get(job_id)
        if not batch_rec or not job_rec:
            return

        # If batch was cancelled, mark remaining job as cancelled
        if batch_rec.get("status") == BatchProductionStatus.CANCELLED.value:
            if job_rec.get("status") in (ReplacementJobStatus.PENDING.value, ReplacementJobStatus.QUEUED.value):
                job_rec["status"] = ReplacementJobStatus.CANCELLED.value
                job_rec["current_step"] = "Đã hủy theo yêu cầu của đợt sản xuất hàng loạt"
                _save_jobs_db()
                self._recalculate_batch_status(batch_id)
            return

        # Update batch status to PROCESSING
        if batch_rec.get("status") in (BatchProductionStatus.CONFIRMED.value, BatchProductionStatus.QUEUED.value):
            batch_rec["status"] = BatchProductionStatus.PROCESSING.value
            batch_rec["started_at"] = batch_rec.get("started_at") or _now_iso()
            _save_batch_db()

        # Resolve records for execution
        project_id = batch_rec["project_id"]
        base_video_rec = self._resolve_base_video(project_id, batch_rec["base_video_asset_id"])
        product_rec = self._resolve_product(project_id, job_rec["product_asset_id"])

        preflight_res = local_garment_pipeline.preflight.validate(base_video_rec, product_rec)

        # Execute using Prompt 09 local pipeline
        logger.info("Executing batch child job %s (product=%s)", job_id, job_rec.get("product_title"))
        local_garment_pipeline.execute_job_now(
            job_id=job_id,
            base_video_record=base_video_rec,
            product_record=product_rec,
            truth_sheet=preflight_res.truth_sheet,
        )

        # Update batch progress & state
        self._recalculate_batch_status(batch_id)

    def _recalculate_batch_status(self, batch_id: str) -> None:
        batch_rec = _BATCH_GROUPS_DB.get(batch_id)
        if not batch_rec:
            return

        job_ids = batch_rec.get("job_ids", [])
        total = len(job_ids)
        if total == 0:
            return

        completed_cnt = 0
        failed_cnt = 0
        cancelled_cnt = 0
        processing_cnt = 0
        queued_cnt = 0
        total_progress_sum = 0

        for j_id in job_ids:
            j = _REPLACEMENT_JOBS_DB.get(j_id)
            if not j:
                continue

            j_status = j.get("status")
            j_progress = j.get("progress", 0)
            total_progress_sum += j_progress

            if j_status in (ReplacementJobStatus.COMPLETED.value, ReplacementJobStatus.NEEDS_REVIEW.value):
                completed_cnt += 1
            elif j_status in (ReplacementJobStatus.FAILED.value, ReplacementJobStatus.BLOCKED.value):
                failed_cnt += 1
            elif j_status == ReplacementJobStatus.CANCELLED.value:
                cancelled_cnt += 1
            elif j_status in (ReplacementJobStatus.PENDING.value,):
                queued_cnt += 1
            else:
                processing_cnt += 1

        batch_rec["completed_jobs"] = completed_cnt
        batch_rec["failed_jobs"] = failed_cnt
        batch_rec["cancelled_jobs"] = cancelled_cnt
        batch_rec["processing_jobs"] = processing_cnt
        batch_rec["queued_jobs"] = queued_cnt
        batch_rec["progress"] = min(100, int(total_progress_sum / total))

        is_cancelled = batch_rec.get("status") == BatchProductionStatus.CANCELLED.value

        finished_count = completed_cnt + failed_cnt + cancelled_cnt
        if finished_count == total:
            batch_rec["completed_at"] = _now_iso()
            if completed_cnt == total:
                batch_rec["status"] = BatchProductionStatus.COMPLETED.value
            elif failed_cnt == total:
                batch_rec["status"] = BatchProductionStatus.FAILED.value
            elif cancelled_cnt > 0 or is_cancelled:
                batch_rec["status"] = BatchProductionStatus.CANCELLED.value
            else:
                batch_rec["status"] = BatchProductionStatus.PARTIALLY_COMPLETED.value
        elif is_cancelled:
            batch_rec["status"] = BatchProductionStatus.CANCELLED.value
        elif processing_cnt > 0 or completed_cnt > 0:
            batch_rec["status"] = BatchProductionStatus.PROCESSING.value

        _save_batch_db()

    def _resolve_base_video(self, project_id: str, base_video_asset_id: str) -> dict[str, Any]:
        for gen in _GENERATIONS_DB.values():
            if (
                gen.get("output_video_asset_id") == base_video_asset_id
                or gen.get("generation_id") == base_video_asset_id
                or (gen.get("project_id") == project_id and gen.get("status") == "COMPLETED")
            ):
                return gen

        project = _PROJECTS_DB.get(project_id)
        if project and project.get("output_video_url"):
            return {
                "status": "COMPLETED",
                "model_name": project.get("model_name", "Người mẫu"),
                "storage_path": f"users/usr-system-default/projects/{project_id}/personalizations/{project.get('current_generation_id', 'gen-001')}/base-video/personalized_base_video.mp4",
            }

        return {"status": "COMPLETED", "model_name": "Người mẫu", "storage_path": ""}

    def _resolve_product(self, project_id: str, product_asset_id: str) -> dict[str, Any]:
        product = _PRODUCT_ASSETS_DB.get(product_asset_id)
        if product:
            return product
        for p in _PRODUCT_ASSETS_DB.values():
            if p.get("project_id") == project_id and p.get("product_id") == product_asset_id:
                return p
        raise ValueError(f"Không tìm thấy Product Asset '{product_asset_id}'.")

    # =========================================================================
    # Public Batch Production API Methods
    # =========================================================================

    def check_batch_preflight(
        self,
        project_id: str,
        base_video_asset_id: str,
        product_asset_ids: list[str],
    ) -> BatchPreflightResponse:
        """
        Validates a list of Product Assets against the selected Personalized Base Video.
        """
        base_video = self._resolve_base_video(project_id, base_video_asset_id)
        items: list[BatchPreflightProductItem] = []

        eligible_count = 0
        warnings_count = 0
        blocked_count = 0

        for pid in product_asset_ids:
            try:
                prod = self._resolve_product(project_id, pid)
                pf = local_garment_pipeline.preflight.validate(base_video, prod)

                if not pf.can_replace:
                    status = BatchProductEligibilityStatus.BLOCKED
                    blocked_count += 1
                elif pf.warnings:
                    status = BatchProductEligibilityStatus.WARNINGS
                    warnings_count += 1
                else:
                    status = BatchProductEligibilityStatus.ELIGIBLE
                    eligible_count += 1

                items.append(
                    BatchPreflightProductItem(
                        product_id=pid,
                        product_title=prod.get("custom_title") or prod.get("title", "Sản phẩm"),
                        variant_id=prod.get("variant_id"),
                        primary_image_url=prod.get("primary_image_url") or (prod.get("images", [{}])[0].get("storage_path") if prod.get("images") else None),
                        status=status,
                        category_compatibility=pf.category_compatibility,
                        target_garment_slot=pf.target_garment_slot,
                        truth_sheet=pf.truth_sheet,
                        blocking_reasons=pf.blocking_reasons,
                        warnings=pf.warnings,
                    )
                )
            except Exception as e:
                blocked_count += 1
                items.append(
                    BatchPreflightProductItem(
                        product_id=pid,
                        product_title=f"Sản phẩm ({pid})",
                        status=BatchProductEligibilityStatus.BLOCKED,
                        category_compatibility="UNSUPPORTED",
                        target_garment_slot="unknown",
                        blocking_reasons=[str(e)],
                    )
                )

        can_proceed = (eligible_count + warnings_count) > 0 and blocked_count == 0

        return BatchPreflightResponse(
            can_proceed=can_proceed,
            total_requested=len(product_asset_ids),
            eligible_count=eligible_count,
            warnings_count=warnings_count,
            blocked_count=blocked_count,
            items=items,
        )

    def create_batch(
        self,
        user_id: str,
        request: CreateBatchProductionRequest,
    ) -> BatchProductionGroup:
        """
        Creates a BatchProductionGroup and enqueues individual child Replacement Jobs.
        Idempotent via idempotency_key.
        """
        if request.idempotency_key and request.idempotency_key in _IDEMPOTENCY_CACHE:
            existing_batch_id = _IDEMPOTENCY_CACHE[request.idempotency_key]
            existing = _BATCH_GROUPS_DB.get(existing_batch_id)
            if existing and existing.get("project_id") == request.project_id:
                logger.info("Returning existing batch %s for idempotency key %s", existing_batch_id, request.idempotency_key)
                self._ensure_worker()
                for j_id in existing.get("job_ids", []):
                    j = _REPLACEMENT_JOBS_DB.get(j_id)
                    if j and j.get("status") == ReplacementJobStatus.PENDING.value:
                        self._work_queue.put((existing_batch_id, j_id))
                return BatchProductionGroup(**existing)

        base_video = self._resolve_base_video(request.project_id, request.base_video_asset_id)
        batch_id = f"bpg-{uuid.uuid4().hex[:12]}"
        now = _now_iso()

        job_ids: list[str] = []

        # Validate products & instantiate child jobs (without immediate execution)
        for pid in request.product_asset_ids:
            prod = self._resolve_product(request.project_id, pid)
            pf = local_garment_pipeline.preflight.validate(base_video, prod)

            if not pf.can_replace:
                if not request.confirmed_limitations:
                    raise ValueError(f"Sản phẩm '{prod.get('title')}' bị chặn: {'; '.join(pf.blocking_reasons)}")

            child_req = CreateReplacementJobRequest(
                project_id=request.project_id,
                base_video_asset_id=request.base_video_asset_id,
                product_asset_id=pid,
                batch_id=batch_id,
                confirmed_limitations=request.confirmed_limitations,
            )

            job_resp = local_garment_pipeline.create_job(
                user_id=user_id,
                request=child_req,
                base_video_record=base_video,
                product_record=prod,
                start_immediately=False,  # Enqueued into batch orchestrator
            )
            job_ids.append(job_resp.job_id)

        default_name = request.batch_name or f"Đợt sản xuất {len(job_ids)} sản phẩm ({datetime.now().strftime('%d/%m %H:%M')})"

        batch_record = {
            "batch_id": batch_id,
            "project_id": request.project_id,
            "user_id": user_id,
            "name": default_name,
            "base_video_asset_id": request.base_video_asset_id,
            "base_video_title": f"Base Video - {base_video.get('model_name', 'Người mẫu')}",
            "model_name": base_video.get("model_name", "Người mẫu"),
            "status": BatchProductionStatus.QUEUED.value,
            "total_jobs": len(job_ids),
            "queued_jobs": len(job_ids),
            "processing_jobs": 0,
            "completed_jobs": 0,
            "failed_jobs": 0,
            "cancelled_jobs": 0,
            "progress": 0,
            "created_at": now,
            "started_at": None,
            "completed_at": None,
            "job_ids": job_ids,
            "idempotency_key": request.idempotency_key,
        }

        _BATCH_GROUPS_DB[batch_id] = batch_record
        if request.idempotency_key:
            _IDEMPOTENCY_CACHE[request.idempotency_key] = batch_id
        _save_batch_db()

        # Enqueue child jobs into background queue
        self._ensure_worker()
        for j_id in job_ids:
            self._work_queue.put((batch_id, j_id))

        return BatchProductionGroup(**batch_record)

    def get_batch(self, project_id: str, batch_id: str) -> BatchDetailResponse:
        batch_rec = _BATCH_GROUPS_DB.get(batch_id)
        if not batch_rec or batch_rec.get("project_id") != project_id:
            raise KeyError(f"Không tìm thấy đợt sản xuất '{batch_id}' trong dự án này.")

        jobs: list[ReplacementJobResponse] = []
        for j_id in batch_rec.get("job_ids", []):
            j = _REPLACEMENT_JOBS_DB.get(j_id)
            if j:
                jobs.append(ReplacementJobResponse(**j))

        return BatchDetailResponse(
            batch=BatchProductionGroup(**batch_rec),
            jobs=jobs,
        )

    def list_batches(self, project_id: str) -> list[BatchProductionGroup]:
        batches = [b for b in _BATCH_GROUPS_DB.values() if b.get("project_id") == project_id]
        sorted_batches = sorted(batches, key=lambda x: x.get("created_at", ""), reverse=True)
        return [BatchProductionGroup(**b) for b in sorted_batches]

    def cancel_batch(self, project_id: str, batch_id: str) -> BatchProductionGroup:
        batch_rec = _BATCH_GROUPS_DB.get(batch_id)
        if not batch_rec or batch_rec.get("project_id") != project_id:
            raise KeyError(f"Không tìm thấy đợt sản xuất '{batch_id}'.")

        batch_rec["status"] = BatchProductionStatus.CANCELLED.value
        cancelled_now = 0

        for j_id in batch_rec.get("job_ids", []):
            j = _REPLACEMENT_JOBS_DB.get(j_id)
            if j and j.get("status") in (ReplacementJobStatus.PENDING.value,):
                j["status"] = ReplacementJobStatus.CANCELLED.value
                j["current_step"] = "Đã hủy bởi người dùng"
                cancelled_now += 1

        _save_jobs_db()
        self._recalculate_batch_status(batch_id)
        return BatchProductionGroup(**batch_rec)

    def retry_job(self, project_id: str, batch_id: str, job_id: str) -> ReplacementJobResponse:
        batch_rec = _BATCH_GROUPS_DB.get(batch_id)
        if not batch_rec or batch_rec.get("project_id") != project_id:
            raise KeyError(f"Không tìm thấy đợt sản xuất '{batch_id}'.")

        job_rec = _REPLACEMENT_JOBS_DB.get(job_id)
        if not job_rec or job_rec.get("job_id") not in batch_rec.get("job_ids", []):
            raise KeyError(f"Tác vụ '{job_id}' không thuộc đợt sản xuất này.")

        # Reset job state
        job_rec["status"] = ReplacementJobStatus.PENDING.value
        job_rec["current_step"] = "Đang chờ xếp hàng xử lý lại"
        job_rec["progress"] = 0
        job_rec["error_code"] = None
        job_rec["error_message"] = None
        _save_jobs_db()

        # Update batch status
        batch_rec["status"] = BatchProductionStatus.PROCESSING.value
        _save_batch_db()

        # Re-enqueue
        self._ensure_worker()
        self._work_queue.put((batch_id, job_id))

        return ReplacementJobResponse(**job_rec)

    # =========================================================================
    # Final Video Library Methods
    # =========================================================================

    def query_final_video_library(
        self,
        project_id: str,
        page: int = 1,
        limit: int = 20,
        search: str | None = None,
        batch_id: str | None = None,
        product_id: str | None = None,
        quality_status: str | None = None,
        sort_by: str = "created_at",
        sort_dir: str = "desc",
        include_archived: bool = False,
    ) -> FinalVideoLibraryResponse:
        """
        Queries and filters the Final Product Video assets for a project.
        """
        all_videos: list[FinalVideoItem] = []

        for j in _REPLACEMENT_JOBS_DB.values():
            if j.get("project_id") != project_id:
                continue

            # Must have generated an output video
            if not j.get("output_video_asset_id") and not j.get("output_video_url"):
                continue

            is_archived = j.get("job_id") in self._archived_videos
            if is_archived and not include_archived:
                continue

            # Filters
            if batch_id and j.get("batch_id") != batch_id:
                continue
            if product_id and j.get("product_asset_id") != product_id:
                continue

            q_rev = j.get("quality_review") or {}
            q_stat = q_rev.get("overall_status", "PASS")
            if quality_status and q_stat != quality_status:
                continue

            # Search keyword
            prod_title = j.get("product_title", "")
            if search and search.strip():
                term = search.strip().lower()
                if term not in prod_title.lower() and term not in j.get("job_id", "").lower():
                    continue

            item = FinalVideoItem(
                video_id=j["job_id"],
                project_id=project_id,
                batch_id=j.get("batch_id"),
                product_id=j.get("product_asset_id", ""),
                product_title=prod_title,
                variant_title=j.get("processing_config", {}).get("variant_title"),
                model_name=j.get("model_name", "Người mẫu"),
                base_video_asset_id=j.get("base_video_asset_id", ""),
                video_asset_id=j.get("output_video_asset_id") or j["job_id"],
                video_url=j.get("output_video_url") or "",
                thumbnail_url=j.get("output_thumbnail_url") or "",
                contact_sheet_url=j.get("output_contact_sheet_url"),
                side_by_side_url=j.get("output_side_by_side_url"),
                duration_ms=j.get("duration_ms") or 5000,
                width=j.get("width") or 1080,
                height=j.get("height") or 1920,
                fps=j.get("fps") or 30,
                codec=j.get("codec") or "h264",
                file_size_bytes=j.get("file_size_bytes") or 0,
                sha256=j.get("output_video_sha256") or "",
                quality_review=q_rev if q_rev else None,
                user_decision=j.get("user_decision", UserDecision.PENDING_REVIEW.value),
                created_at=j.get("completed_at") or j.get("created_at", ""),
                is_archived=is_archived,
            )
            all_videos.append(item)

        # Sorting
        reverse = sort_dir.lower() == "desc"
        if sort_by == "product_title":
            all_videos.sort(key=lambda x: x.product_title.lower(), reverse=reverse)
        else:
            all_videos.sort(key=lambda x: x.created_at, reverse=reverse)

        total = len(all_videos)
        total_pages = max(1, (total + limit - 1) // limit)
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paged_items = all_videos[start_idx:end_idx]

        return FinalVideoLibraryResponse(
            items=paged_items,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )

    def toggle_archive_video(self, video_id: str) -> bool:
        if video_id in self._archived_videos:
            self._archived_videos.remove(video_id)
            return False
        else:
            self._archived_videos.add(video_id)
            return True

    def get_video_safe_file_path(self, project_id: str, video_id: str) -> tuple[Path, str]:
        """
        Locates the MP4 file and generates a clean sanitized download filename.
        """
        job = _REPLACEMENT_JOBS_DB.get(video_id)
        if not job or job.get("project_id") != project_id:
            raise KeyError(f"Không tìm thấy video '{video_id}' trong dự án này.")

        rel_path = f"{job['rel_storage_path']}/final/final_product_video.mp4"
        safe_path = storage_service.resolve_safe_path(rel_path)

        if not safe_path.is_file():
            # Check fallback
            for cand in [Path(f"data/storage/{rel_path}"), Path(f"../../data/storage/{rel_path}")]:
                if cand.is_file():
                    safe_path = cand
                    break

        if not safe_path.is_file():
            raise FileNotFoundError(f"Tệp tin video không tồn tại tại {safe_path}")

        clean_title = re.sub(r"[^\w\.-]", "_", job.get("product_title", "video"))
        clean_title = re.sub(r"_+", "_", clean_title).strip("_")
        raw_name = f"TrendMotion_{clean_title}_{video_id[:6]}.mp4"
        return safe_path, raw_name

    def generate_export_zip(
        self,
        project_id: str,
        video_ids: list[str] | None = None,
    ) -> tuple[Path, str, int, int]:
        """
        Bundles target completed MP4 videos and a detailed manifest.json into a temporary ZIP.
        """
        target_jobs = []
        for j in _REPLACEMENT_JOBS_DB.values():
            if j.get("project_id") != project_id:
                continue
            if video_ids and j["job_id"] not in video_ids:
                continue
            if j.get("status") in (ReplacementJobStatus.COMPLETED.value, ReplacementJobStatus.NEEDS_REVIEW.value):
                target_jobs.append(j)

        if not target_jobs:
            raise ValueError("Không có video thành phẩm nào phù hợp để xuất ZIP.")

        temp_dir = storage_service.resolve_safe_path("temp")
        temp_dir.mkdir(parents=True, exist_ok=True)

        zip_id = uuid.uuid4().hex[:8]
        zip_filename = f"TrendMotion_{project_id}_{zip_id}.zip"
        zip_path = temp_dir / zip_filename

        manifest_items = []
        total_size = 0

        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for job in target_jobs:
                rel_p = f"{job['rel_storage_path']}/final/final_product_video.mp4"
                try:
                    p = storage_service.resolve_safe_path(rel_p)
                    if p.is_file():
                        clean_title = re.sub(r"[^\w\.-]", "_", job.get("product_title", "product"))
                        clean_title = re.sub(r"_+", "_", clean_title).strip("_")
                        in_zip_name = f"videos/TrendMotion_{clean_title}_{job['job_id'][:6]}.mp4"
                        zf.write(p, in_zip_name)
                        total_size += p.stat().st_size

                        manifest_items.append({
                            "job_id": job["job_id"],
                            "product_asset_id": job.get("product_asset_id"),
                            "product_title": job.get("product_title"),
                            "model_name": job.get("model_name"),
                            "base_video_asset_id": job.get("base_video_asset_id"),
                            "archive_filename": in_zip_name,
                            "sha256": job.get("output_video_sha256"),
                            "duration_ms": job.get("duration_ms"),
                            "width": job.get("width"),
                            "height": job.get("height"),
                            "fps": job.get("fps"),
                            "quality_status": job.get("quality_review", {}).get("overall_status", "PASS"),
                            "completed_at": job.get("completed_at"),
                        })
                except Exception as e:
                    logger.warning("Could not include video %s in ZIP: %s", job["job_id"], e)

            manifest_content = {
                "project_id": project_id,
                "exported_at": _now_iso(),
                "total_videos": len(manifest_items),
                "items": manifest_items,
            }
            zf.writestr("manifest.json", json.dumps(manifest_content, indent=2, ensure_ascii=False))

        return zip_path, zip_filename, len(manifest_items), total_size


batch_orchestrator = BatchProductionOrchestrator()
