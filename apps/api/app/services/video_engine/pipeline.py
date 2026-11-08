import logging
from dataclasses import asdict
from pathlib import Path
from typing import Any

from .compositing import CompositingService
from .frame_composition import FrameCompositionService
from .frame_extraction import FrameExtractionService
from .model_identity import ModelIdentityService
from .model_runtime import ModelRuntimeManager
from .motion_data import MotionDataService
from .motion_retargeting import MotionRetargetingService
from .person_tracking import PersonTrackingService
from .pose_estimation import PoseEstimationService
from .presets import get_preset_config
from .rendering import VideoRenderingService
from .scene_analysis import SceneAnalysisService
from .segmentation import SegmentationService
from .temporal_consistency import TemporalConsistencyService
from .types import VideoAnalysisArtifacts
from app.services.quality_control import local_quality_engine

logger = logging.getLogger(__name__)


class VideoEngine:
    """
    Main local orchestrator executing the entire Video Analysis
    and Model Personalization pipeline completely on local CPU/GPU and FFmpeg.
    """

    def __init__(self):
        self.model_runtime = ModelRuntimeManager()
        self.frame_extractor = FrameExtractionService()
        self.scene_analyzer = SceneAnalysisService()
        self.person_tracker = PersonTrackingService()
        self.pose_estimator = PoseEstimationService()
        self.segmenter = SegmentationService()
        self.motion_data = MotionDataService()
        self.motion_retargeter = MotionRetargetingService()
        self.model_identity = ModelIdentityService()
        self.frame_compositor = FrameCompositionService()
        self.compositor = CompositingService()
        self.temporal_smoother = TemporalConsistencyService()
        self.renderer = VideoRenderingService()

    def analyze_template_video(
        self,
        template_id: str,
        video_path: Path,
        analysis_root_dir: Path,
        max_fps: int = 15,
    ) -> VideoAnalysisArtifacts:
        """
        Executes complete local video analysis:
        Decoding -> Frame extraction -> Scene transitions -> Pose estimation ->
        Person tracking -> Motion retargeting -> Skeletons -> Garment Slots.
        """
        logger.info("Starting local Video Analysis Engine for template: %s", template_id)

        frames_dir = analysis_root_dir / "frames"
        skeletons_dir = analysis_root_dir / "skeletons"
        masks_dir = analysis_root_dir / "masks"
        poster_path = analysis_root_dir.parent / "poster" / "poster.jpg"

        # 1. Probe & Extract Poster
        probe = self.frame_extractor.probe_video(video_path)
        self.frame_extractor.extract_poster(video_path, poster_path)

        # 2. Extract frames
        frame_records = self.frame_extractor.extract_frames(
            video_path=video_path,
            output_dir=frames_dir,
            max_fps=max_fps,
        )

        # 3. Analyze Scenes
        scenes = self.scene_analyzer.analyze_scenes(frame_records, fps=probe["fps"])

        # 4. Human Pose Estimation & Skeletons
        pose_sequence = self.pose_estimator.estimate_pose_sequence(
            frame_records=frame_records,
            output_skeletons_dir=skeletons_dir,
        )

        # 5. Continuous Person Tracking
        tracking_artifacts = self.person_tracker.track_subject(
            frame_records=frame_records,
            pose_sequence=pose_sequence,
        )

        # 6. Motion Representation & Geometric Retargeting
        motion_rep = self.motion_retargeter.build_motion_representation(
            pose_sequence=pose_sequence,
            target_model_scale=1.0,
        )

        # 7. Segmentation & Garment Slots
        garment_slots = self.segmenter.segment_frames(
            frame_records=frame_records,
            pose_sequence=pose_sequence,
            output_masks_dir=masks_dir,
        )

        artifacts = VideoAnalysisArtifacts(
            template_id=template_id,
            video_path=str(video_path),
            duration_ms=probe["duration_ms"],
            width=probe["width"],
            height=probe["height"],
            aspect_ratio=probe["aspect_ratio"],
            frame_rate=probe["fps"],
            total_frames=len(frame_records),
            scenes=scenes,
            pose_sequence=pose_sequence,
            garment_slots=garment_slots,
            frames_dir=str(frames_dir),
            skeletons_dir=str(skeletons_dir),
            masks_dir=str(masks_dir),
            poster_path=str(poster_path),
            diagnostics={
                "has_audio": probe["has_audio"],
                "video_codec": probe["video_codec"],
                "bitrate": probe["bitrate"],
                "scenes_detected": len(scenes),
                "poses_computed": len(pose_sequence),
                "slots_identified": len(garment_slots),
                "tracking_ratio": tracking_artifacts.continuous_tracking_ratio,
                "hardware_device": self.model_runtime.device,
            },
        )

        # 8. Save persistent artifacts
        self.motion_data.save_artifacts(artifacts, analysis_root_dir)
        self.motion_data.save_tracking_artifacts(
            {
                "primary_tracking_id": tracking_artifacts.primary_tracking_id,
                "total_frames": tracking_artifacts.total_frames,
                "continuous_tracking_ratio": tracking_artifacts.continuous_tracking_ratio,
                "occlusion_intervals": tracking_artifacts.occlusion_intervals,
            },
            analysis_root_dir,
        )
        self.motion_data.save_motion_representation(
            {
                "total_frames": motion_rep.total_frames,
                "average_aspect_ratio": motion_rep.average_aspect_ratio,
                "normalized_frames": [asdict(nf) for nf in motion_rep.normalized_frames],
            },
            analysis_root_dir,
        )

        self.model_runtime.cleanup_memory()
        logger.info("Video Analysis completed successfully for %s", template_id)
        return artifacts

    def personalize_video(
        self,
        generation_id: str,
        template_source_video: Path,
        template_analysis_dir: Path,
        model_photo_paths: list[Path],
        output_dir: Path,
        preset_name: str = "standard",
        progress_callback: Any = None,
    ) -> Path:
        """
        Executes complete local Model Personalization:
        Identity Extraction -> Driving Pose Retargeting -> Frame Composition ->
        Layered Compositing -> Temporal Smoothing -> Media Rendering -> Contact Sheet.
        """
        preset = get_preset_config(preset_name)
        logger.info(
            "Starting local Model Personalization Engine for generation: %s (Preset: %s)",
            generation_id,
            preset.name,
        )

        acquired = self.model_runtime.acquire_slot(f"personalize_{generation_id}")
        if not acquired:
            logger.warning("Resource semaphore acquisition timed out, proceeding with degraded throttle.")

        try:
            raw_frames_dir = output_dir / "intermediate" / "raw_composed"
            composited_dir = output_dir / "intermediate" / "composited"
            smoothed_dir = output_dir / "intermediate" / "smoothed"
            output_video_path = output_dir / "base-video" / "personalized_base_video.mp4"
            output_thumb_path = output_dir / "base-video" / "thumbnail.jpg"
            output_sheet_path = output_dir / "base-video" / "contact_sheet.jpg"

            raw_frames_dir.mkdir(parents=True, exist_ok=True)
            composited_dir.mkdir(parents=True, exist_ok=True)
            smoothed_dir.mkdir(parents=True, exist_ok=True)
            output_video_path.parent.mkdir(parents=True, exist_ok=True)

            # 1. Extract Model Identity
            if progress_callback:
                progress_callback(25, "Trích xuất đặc điểm nhân dạng người mẫu từ ảnh tham chiếu")
            identity_data = self.model_identity.extract_identity(model_photo_paths)

            # 2. Load Driving Motion Artifacts
            if progress_callback:
                progress_callback(40, "Nạp chuỗi tư thế chuyển động và mặt nạ phân vùng")
            artifacts_data = self.motion_data.load_artifacts(template_analysis_dir)
            poses = artifacts_data["pose_sequence"]
            meta = artifacts_data["metadata"]
            fps = min(preset.fps, meta.get("frame_rate", 30))

            frames_src_dir = Path(meta["frames_dir"])
            source_frame_files = sorted(frames_src_dir.glob("frame_*.jpg"))
            if not source_frame_files:
                raise FileNotFoundError(f"No driving frames found in {frames_src_dir}")

            # 3. Identity-conditioned Frame Composition
            if progress_callback:
                progress_callback(55, "Tổng hợp khung hình: Ghép người mẫu vào chuyển động video mẫu")

            composed_frame_paths: list[Path] = []
            for idx, src_frame in enumerate(source_frame_files):
                pose_dict = poses[idx] if idx < len(poses) else poses[-1]
                from .types import Keypoint, PoseFrame
                kps_map = {k: Keypoint(**v) for k, v in pose_dict["keypoints"].items()}
                pose_obj = PoseFrame(
                    frame_index=pose_dict["frame_index"],
                    timestamp_ms=pose_dict["timestamp_ms"],
                    keypoints=kps_map,
                    body_orientation=pose_dict["body_orientation"],
                    movement_vector=tuple(pose_dict["movement_vector"]),
                    gesture=pose_dict["gesture"],
                )

                out_f = raw_frames_dir / f"frame_{idx:04d}.jpg"
                self.frame_compositor.compose_frame(
                    source_frame_path=src_frame,
                    mask_path=None,
                    pose=pose_obj,
                    identity_data=identity_data,
                    output_frame_path=out_f,
                )
                composed_frame_paths.append(out_f)

            # 4. Layered Compositing & Background Preservation
            if progress_callback:
                progress_callback(70, "Bảo toàn bối cảnh nền và xử lý hòa trộn đa tầng (Layered Compositing)")
            composited_frame_paths = self.compositor.composite_frame_sequence(
                source_frame_paths=source_frame_files,
                synthesized_frame_paths=composed_frame_paths,
                output_dir=composited_dir,
            )

            # 5. Temporal Consistency Smoothing
            if progress_callback:
                progress_callback(85, "Áp dụng lọc mượt chuyển động và ổn định nhất quán khung hình (Temporal Smoothing)")
            smoothed_frame_paths = self.temporal_smoother.smooth_frames(
                frame_paths=composited_frame_paths or composed_frame_paths,
                output_dir=smoothed_dir,
                alpha=preset.temporal_alpha,
            )

            # 6. Final Video Assembly with FFmpeg
            if progress_callback:
                progress_callback(92, "Lắp ráp chuỗi khung hình, đồng bộ âm thanh gốc và đóng gói MP4")
            self.renderer.render_video_from_frames(
                frames_dir=smoothed_dir,
                output_video_path=output_video_path,
                fps=fps,
                source_audio_video_path=template_source_video if template_source_video.is_file() else None,
                width=preset.target_width,
                height=preset.target_height,
                crf=preset.crf,
            )

            # 7. Extract representative thumbnail and Contact Sheet
            self.frame_extractor.extract_poster(output_video_path, output_thumb_path)
            self.renderer.generate_contact_sheet(output_video_path, output_sheet_path)

            # 8. Quantitative Base Video Quality Control
            qc_report = local_quality_engine.evaluate_base_video(
                video_path=output_video_path,
                expected_width=preset.target_width,
                expected_height=preset.target_height,
                expected_fps=fps,
                frames_dir=smoothed_dir,
                identity_data=identity_data,
            )
            qc_file = output_dir / "base-video" / "quality_report.json"
            qc_file.write_text(qc_report.model_dump_json(indent=2), encoding="utf-8")

            self.model_runtime.cleanup_memory()
            logger.info("Model Personalization completed: %s (QC Status: %s)", output_video_path, qc_report.overall_status.value)
            return output_video_path
        finally:
            if acquired:
                self.model_runtime.release_slot()


# Global singleton instance
local_video_engine = VideoEngine()
