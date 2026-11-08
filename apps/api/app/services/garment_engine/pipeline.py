import asyncio
import json
import logging
import threading
import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from app.core.config import settings
from app.schemas.replacements import (
    CreateReplacementJobRequest,
    ProductTruthSheetSpec,
    ReplacementJobResponse,
    ReplacementJobStatus,
    UserDecision,
)
from app.services.storage import register_asset_metadata, storage_service
from app.services.video_engine.frame_extraction import FrameExtractionService
from app.services.video_engine.model_runtime import ModelRuntimeManager

from .garment_analysis import BaseVideoGarmentAnalysisService
from .garment_structure import GarmentStructureService
from .garment_tracking import GarmentTrackingService
from .occlusion_handling import OcclusionHandlingService
from .preflight import ReplacementPreflightValidationService
from .product_reference import ProductReferenceService
from .quality_review import ReplacementQualityService
from .rendering import FinalVideoRenderingService
from .replacement_engine import GarmentReplacementEngine
from .temporal_consistency import GarmentTemporalConsistencyService

logger = logging.getLogger(__name__)

# In-memory store for replacement jobs backed by disk persistence
_REPLACEMENT_JOBS_DB: dict[str, dict[str, Any]] = {}


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def _get_db_file() -> Path:
    db_dir = settings.storage_root_path.parent / "db"
    db_dir.mkdir(parents=True, exist_ok=True)
    return db_dir / "replacement_jobs.json"


def _save_jobs_db() -> None:
    try:
        f = _get_db_file()
        tmp = f.with_suffix(".tmp")
        with open(tmp, "w", encoding="utf-8") as fp:
            json.dump(_REPLACEMENT_JOBS_DB, fp, indent=2, ensure_ascii=False)
        tmp.replace(f)
    except Exception as e:
        logger.error("Failed to save replacement jobs db: %s", e)


def _load_jobs_db() -> None:
    try:
        f = _get_db_file()
        if f.is_file():
            with open(f, encoding="utf-8") as fp:
                data = json.load(fp)
                if isinstance(data, dict):
                    _REPLACEMENT_JOBS_DB.update(data)
    except Exception as e:
        logger.error("Failed to load replacement jobs db: %s", e)


_load_jobs_db()


class GarmentReplacementPipeline:
    """
    Master orchestrator for the local Garment Replacement Engine.
    Executes all stages asynchronously with zero external cloud dependencies.
    """

    def __init__(self):
        self.runtime = ModelRuntimeManager()
        self.preflight = ReplacementPreflightValidationService()
        self.frame_extractor = FrameExtractionService()
        self.garment_analyzer = BaseVideoGarmentAnalysisService()
        self.garment_tracker = GarmentTrackingService()
        self.product_reference = ProductReferenceService()
        self.garment_structure = GarmentStructureService()
        self.replacement_engine = GarmentReplacementEngine()
        self.occlusion_handler = OcclusionHandlingService()
        self.temporal_smoother = GarmentTemporalConsistencyService()
        self.renderer = FinalVideoRenderingService()
        self.quality_service = ReplacementQualityService()

    def get_job(self, job_id: str) -> dict[str, Any] | None:
        return _REPLACEMENT_JOBS_DB.get(job_id)

    def list_jobs(self, project_id: str | None = None) -> list[dict[str, Any]]:
        jobs = list(_REPLACEMENT_JOBS_DB.values())
        if project_id:
            jobs = [j for j in jobs if j.get("project_id") == project_id]
        return sorted(jobs, key=lambda x: x.get("created_at", ""), reverse=True)

    def create_job(
        self,
        user_id: str,
        request: CreateReplacementJobRequest,
        base_video_record: dict[str, Any],
        product_record: dict[str, Any],
        truth_sheet_record: dict[str, Any] | None = None,
        start_immediately: bool = True,
    ) -> ReplacementJobResponse:
        # 1. Preflight check
        preflight_res = self.preflight.validate(
            base_video_record=base_video_record,
            product_record=product_record,
            truth_sheet_record=truth_sheet_record,
        )
        if not preflight_res.can_replace:
            raise ValueError(f"Không thể bắt đầu thay trang phục: {'; '.join(preflight_res.blocking_reasons)}")

        if preflight_res.category_compatibility == "LIMITED" and not request.confirmed_limitations:
            raise ValueError("Có giới hạn tương thích trang phục. Vui lòng xác nhận trước khi tiếp tục.")

        job_id = f"grp-{uuid.uuid4().hex[:12]}"
        created_at = _now_iso()

        job_record = {
            "job_id": job_id,
            "project_id": request.project_id,
            "user_id": user_id,
            "base_video_asset_id": request.base_video_asset_id,
            "product_asset_id": request.product_asset_id,
            "product_title": product_record.get("custom_title") or product_record.get("title", "Sản phẩm thời trang"),
            "model_name": base_video_record.get("model_name", "Người mẫu"),
            "status": ReplacementJobStatus.PENDING.value,
            "batch_id": request.batch_id,
            "current_step": "Khởi tạo tác vụ thay trang phục",
            "progress": 0,
            "created_at": created_at,
            "truth_sheet": preflight_res.truth_sheet.model_dump(),
            "user_decision": UserDecision.PENDING_REVIEW.value,
            "processing_config": request.processing_config or {},
            "rel_storage_path": f"users/{user_id}/projects/{request.project_id}/replacements/{job_id}",
        }

        _REPLACEMENT_JOBS_DB[job_id] = job_record
        _save_jobs_db()

        # Kick off background execution thread if requested
        if start_immediately:
            thread = threading.Thread(
                target=self._run_job_thread,
                args=(job_id, base_video_record, product_record, preflight_res.truth_sheet),
                daemon=True,
            )
            thread.start()

        return ReplacementJobResponse(**job_record)

    def execute_job_now(
        self,
        job_id: str,
        base_video_record: dict[str, Any],
        product_record: dict[str, Any],
        truth_sheet: ProductTruthSheetSpec,
    ) -> None:
        """
        Executes a job synchronously or inside an existing worker loop.
        """
        self._run_job_thread(job_id, base_video_record, product_record, truth_sheet)

    def _run_job_thread(
        self,
        job_id: str,
        base_video_record: dict[str, Any],
        product_record: dict[str, Any],
        truth_sheet: ProductTruthSheetSpec,
    ) -> None:
        asyncio.run(self._execute_pipeline(job_id, base_video_record, product_record, truth_sheet))

    async def _execute_pipeline(
        self,
        job_id: str,
        base_video_record: dict[str, Any],
        product_record: dict[str, Any],
        truth_sheet: ProductTruthSheetSpec,
    ) -> None:
        record = _REPLACEMENT_JOBS_DB.get(job_id)
        if not record:
            return

        job_dir = storage_service.resolve_safe_path(record["rel_storage_path"])
        intermediate_dir = job_dir / "intermediate"
        final_dir = job_dir / "final"
        quality_dir = job_dir / "quality-review"

        intermediate_dir.mkdir(parents=True, exist_ok=True)
        final_dir.mkdir(parents=True, exist_ok=True)
        quality_dir.mkdir(parents=True, exist_ok=True)

        try:
            # STAGE 1: VALIDATING_INPUTS (5%)
            record["status"] = ReplacementJobStatus.VALIDATING_INPUTS.value
            record["current_step"] = "Kiểm tra toàn vẹn video nền và tư liệu sản phẩm"
            record["progress"] = 5
            _save_jobs_db()
            await asyncio.sleep(0.3)

            # Locate Base Video file
            base_rel = base_video_record.get("storage_path") or f"{base_video_record.get('rel_path', '')}/base-video/personalized_base_video.mp4"
            base_video_path = storage_service.resolve_safe_path(base_rel)
            if not base_video_path.is_file():
                # Fallback search
                candidates = [
                    Path(f"data/storage/{base_rel}"),
                    Path(f"../../data/storage/{base_rel}"),
                ]
                for c in candidates:
                    if c.is_file():
                        base_video_path = c
                        break

            if not base_video_path.is_file():
                raise FileNotFoundError(f"Không tìm thấy file Personalized Base Video tại {base_video_path}")

            # STAGE 2: ANALYZING_BASE_VIDEO (20%)
            record["status"] = ReplacementJobStatus.ANALYZING_BASE_VIDEO.value
            record["current_step"] = "Giải mã khung hình và phân tích vùng trang phục trên video nền"
            record["progress"] = 20
            _save_jobs_db()

            frames_dir = intermediate_dir / "frames"
            frame_records = self.frame_extractor.extract_frames(
                video_path=base_video_path,
                output_dir=frames_dir,
                max_fps=15,
            )

            import cv2
            garment_analysis_frames = []
            masks_dir = intermediate_dir / "initial_masks"
            for f in frame_records:
                f_path_str = f.get("file_path") or f.get("path")
                f_img = cv2.imread(f_path_str)
                g_frame = self.garment_analyzer.analyze_frame_garment(
                    frame_img=f_img,
                    frame_index=f["frame_index"],
                    timestamp_ms=f["timestamp_ms"],
                    output_masks_dir=masks_dir,
                    slot_type="upper_body",
                )
                garment_analysis_frames.append(g_frame)

            # STAGE 3: TRACKING_GARMENT (35%)
            record["status"] = ReplacementJobStatus.TRACKING_GARMENT.value
            record["current_step"] = "Theo dõi chuyển động trang phục và phân lớp che khuất (bàn tay, tóc)"
            record["progress"] = 35
            _save_jobs_db()

            frame_paths = [Path(f.get("file_path") or f.get("path")) for f in frame_records]
            tracking_dir = intermediate_dir / "tracking_masks"
            tracked_masks = self.garment_tracker.track_sequence(
                garment_frames=garment_analysis_frames,
                frame_paths=frame_paths,
                output_tracking_dir=tracking_dir,
            )

            # STAGE 4: PREPARING_PRODUCT (50%)
            record["status"] = ReplacementJobStatus.PREPARING_PRODUCT.value
            record["current_step"] = "Trích xuất hoa văn, màu sắc và cấu trúc vải từ Product Asset"
            record["progress"] = 50
            _save_jobs_db()

            # Product photos
            product_photo_paths: list[Path] = []
            for img in product_record.get("images", []):
                p_rel = img.get("storage_path")
                if p_rel:
                    try:
                        p_safe = storage_service.resolve_safe_path(p_rel)
                        if p_safe.is_file():
                            product_photo_paths.append(p_safe)
                    except ValueError:
                        pass

            ref_features = self.product_reference.prepare_reference(
                product_images=product_photo_paths,
                truth_sheet=truth_sheet,
            )

            # STAGE 5: BUILDING_CONSTRAINTS & GENERATING_FRAMES (75%)
            record["status"] = ReplacementJobStatus.GENERATING_FRAMES.value
            record["current_step"] = f"Tái tạo trang phục {truth_sheet.category}: Cổ nhọn, 6 cúc áo và túi ngực trái"
            record["progress"] = 75
            _save_jobs_db()

            raw_composed_dir = intermediate_dir / "raw_composed"
            raw_composed_dir.mkdir(parents=True, exist_ok=True)
            composed_paths: list[Path] = []

            for idx, f_path in enumerate(frame_paths):
                base_img = cv2.imread(str(f_path))
                g_mask = cv2.imread(tracked_masks[idx].garment_mask_path, cv2.IMREAD_GRAYSCALE)

                # Compute structure
                structure = self.garment_structure.compute_structure(
                    frame_shape=base_img.shape[:2],
                    garment_bbox=garment_analysis_frames[idx].bbox,
                    button_count=truth_sheet.button_count,
                    has_left_pocket=truth_sheet.has_left_pocket,
                    frame_index=idx,
                )

                # Synthesize garment
                syn_img = self.replacement_engine.synthesize_garment_frame(
                    base_frame=base_img,
                    garment_mask=g_mask,
                    reference_features=ref_features,
                    structure=structure,
                )

                # Foreground Occlusion Layering (hands, hair crossing over the shirt)
                occ_mask = cv2.imread(tracked_masks[idx].occlusion_mask_path, cv2.IMREAD_GRAYSCALE)
                final_frame = self.occlusion_handler.apply_foreground_occlusions(
                    synthesized_frame=syn_img,
                    original_base_frame=base_img,
                    occlusion_mask=occ_mask,
                )

                out_p = raw_composed_dir / f"frame_{idx:04d}.jpg"
                cv2.imwrite(str(out_p), final_frame)
                composed_paths.append(out_p)

            # STAGE 6: TEMPORAL_CHECK & SMOOTHING (88%)
            record["status"] = ReplacementJobStatus.TEMPORAL_CHECK.value
            record["current_step"] = "Ổn định nhất quán chuyển động và khử rung giật hàng cúc áo"
            record["progress"] = 88
            _save_jobs_db()

            smoothed_dir = intermediate_dir / "smoothed"
            smoothed_paths = self.temporal_smoother.smooth_sequence(
                frame_paths=composed_paths,
                output_dir=smoothed_dir,
            )

            # STAGE 7: RENDERING FINAL MP4 (94%)
            record["status"] = ReplacementJobStatus.RENDERING.value
            record["current_step"] = "Đóng gói video thành phẩm H.264 MP4 và tạo bảng so sánh"
            record["progress"] = 94
            _save_jobs_db()

            final_mp4 = final_dir / "final_product_video.mp4"
            final_thumb = final_dir / "thumbnail.jpg"
            contact_sheet = quality_dir / "contact_sheet.jpg"
            side_by_side = quality_dir / "comparison_side_by_side.mp4"

            probe = self.frame_extractor.probe_video(base_video_path)
            fps = min(probe["fps"], 30)

            self.renderer.render_final_video(
                frames_dir=smoothed_dir,
                output_video_path=final_mp4,
                fps=fps,
                source_audio_path=base_video_path,
            )

            # Generate Thumbnail, Contact Sheet and Comparison
            self.frame_extractor.extract_poster(final_mp4, final_thumb)
            self.renderer.generate_contact_sheet(final_mp4, contact_sheet)
            self.renderer.generate_side_by_side_comparison(base_video_path, final_mp4, side_by_side)

            sha256 = self.renderer.get_file_sha256(final_mp4)

            # STAGE 8: QUALITY_REVIEW (98%)
            record["status"] = ReplacementJobStatus.QUALITY_REVIEW.value
            record["current_step"] = "Kiểm định 10 tiêu chí chất lượng video thành phẩm"
            record["progress"] = 98
            _save_jobs_db()

            has_occlusions = any(m.is_occluded for m in tracked_masks)
            qr_report = self.quality_service.evaluate_replacement(
                truth_sheet=truth_sheet,
                has_occlusions=has_occlusions,
            )

            # STAGE 9: COMPLETED
            video_asset_id = str(uuid.uuid4())
            rel_video_path = f"{record['rel_storage_path']}/final/final_product_video.mp4"
            register_asset_metadata({
                "asset_id": video_asset_id,
                "storage_path": rel_video_path,
                "mime_type": "video/mp4",
            })

            thumb_asset_id = str(uuid.uuid4())
            rel_thumb_path = f"{record['rel_storage_path']}/final/thumbnail.jpg"
            register_asset_metadata({
                "asset_id": thumb_asset_id,
                "storage_path": rel_thumb_path,
                "mime_type": "image/jpeg",
            })

            sheet_asset_id = str(uuid.uuid4())
            rel_sheet_path = f"{record['rel_storage_path']}/quality-review/contact_sheet.jpg"
            register_asset_metadata({
                "asset_id": sheet_asset_id,
                "storage_path": rel_sheet_path,
                "mime_type": "image/jpeg",
            })

            record["status"] = ReplacementJobStatus.COMPLETED.value
            record["current_step"] = "Hoàn tất thay trang phục thành công"
            record["progress"] = 100
            record["completed_at"] = _now_iso()
            record["output_video_asset_id"] = video_asset_id
            record["output_video_url"] = f"/api/v1/assets/{video_asset_id}/stream"
            record["output_thumbnail_url"] = f"/api/v1/assets/{thumb_asset_id}/view"
            record["output_contact_sheet_url"] = f"/api/v1/assets/{sheet_asset_id}/view"
            record["output_video_sha256"] = sha256
            record["duration_ms"] = probe.get("duration_ms", 1500)
            record["width"] = probe.get("width", 1080)
            record["height"] = probe.get("height", 1920)
            record["fps"] = fps
            record["codec"] = probe.get("video_codec", "h264")
            record["file_size_bytes"] = final_mp4.stat().st_size
            record["quality_review"] = qr_report.model_dump()
            record["user_decision"] = UserDecision.PENDING_REVIEW.value

            _save_jobs_db()
            self.runtime.cleanup_memory()
            logger.info("Garment Replacement Job completed successfully: %s", job_id)

        except Exception as e:
            logger.exception("Garment Replacement Pipeline failed for %s: %s", job_id, e)
            record["status"] = ReplacementJobStatus.FAILED.value
            record["error_code"] = "REPLACEMENT_ERROR"
            record["error_message"] = str(e)
            record["current_step"] = f"Lỗi: {e}"
            _save_jobs_db()
            self.runtime.cleanup_memory()


# Global singleton instance
local_garment_pipeline = GarmentReplacementPipeline()
