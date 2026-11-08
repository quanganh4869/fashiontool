import logging
from pathlib import Path
from typing import Any

from .frame_extraction import FrameExtractionService
from .scene_analysis import SceneAnalysisService
from .pose_estimation import PoseEstimationService
from .segmentation import SegmentationService
from .motion_data import MotionDataService
from .model_identity import ModelIdentityService
from .frame_composition import FrameCompositionService
from .temporal_consistency import TemporalConsistencyService
from .rendering import VideoRenderingService
from .types import VideoAnalysisArtifacts

logger = logging.getLogger(__name__)


class VideoEngine:
    """
    Main local orchestrator executing the entire Video Analysis
    and Model Personalization pipeline completely on local CPU/GPU and FFmpeg.
    """

    def __init__(self):
        self.frame_extractor = FrameExtractionService()
        self.scene_analyzer = SceneAnalysisService()
        self.pose_estimator = PoseEstimationService()
        self.segmenter = SegmentationService()
        self.motion_data = MotionDataService()
        self.model_identity = ModelIdentityService()
        self.frame_compositor = FrameCompositionService()
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
        Decoding -> Frame extraction -> Scene transitions -> Pose estimation -> Skeletons -> Garment Slots.
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

        # 5. Segmentation & Garment Slots
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
            },
        )

        # 6. Save persistent artifacts
        self.motion_data.save_artifacts(artifacts, analysis_root_dir)
        logger.info("Video Analysis completed successfully for %s", template_id)
        return artifacts

    def personalize_video(
        self,
        generation_id: str,
        template_source_video: Path,
        template_analysis_dir: Path,
        model_photo_paths: list[Path],
        output_dir: Path,
        progress_callback: Any = None,
    ) -> Path:
        """
        Executes complete local Model Personalization:
        Identity Extraction -> Driving Pose Retargeting -> Frame Composition -> Temporal Smoothing -> Media Rendering.
        """
        logger.info("Starting local Model Personalization Engine for generation: %s", generation_id)

        raw_frames_dir = output_dir / "intermediate" / "raw_composed"
        smoothed_dir = output_dir / "intermediate" / "smoothed"
        output_video_path = output_dir / "base-video" / "personalized_base_video.mp4"
        output_thumb_path = output_dir / "base-video" / "thumbnail.jpg"

        raw_frames_dir.mkdir(parents=True, exist_ok=True)
        smoothed_dir.mkdir(parents=True, exist_ok=True)
        output_video_path.parent.mkdir(parents=True, exist_ok=True)

        # 1. Extract Model Identity
        if progress_callback:
            progress_callback(30, "Trích xuất đặc điểm nhân dạng người mẫu từ ảnh tham chiếu")
        identity_data = self.model_identity.extract_identity(model_photo_paths)

        # 2. Load Driving Motion Artifacts
        if progress_callback:
            progress_callback(45, "Nạp chuỗi tư thế chuyển động và mặt nạ phân vùng")
        artifacts_data = self.motion_data.load_artifacts(template_analysis_dir)
        poses = artifacts_data["pose_sequence"]
        meta = artifacts_data["metadata"]
        fps = meta.get("frame_rate", 30)

        frames_src_dir = Path(meta["frames_dir"])
        source_frame_files = sorted(frames_src_dir.glob("frame_*.jpg"))
        if not source_frame_files:
            raise FileNotFoundError(f"No driving frames found in {frames_src_dir}")

        # 3. Identity-conditioned Frame Composition
        if progress_callback:
            progress_callback(60, "Tổng hợp khung hình: Ghép người mẫu vào chuyển động video mẫu")

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

        # 4. Temporal Consistency Smoothing
        if progress_callback:
            progress_callback(80, "Áp dụng lọc mượt chuyển động và ổn định nhất quán khung hình (Temporal Smoothing)")
        smoothed_frame_paths = self.temporal_smoother.smooth_frames(
            frame_paths=composed_frame_paths,
            output_dir=smoothed_dir,
            alpha=0.88,
        )

        # 5. Final Video Assembly with FFmpeg
        if progress_callback:
            progress_callback(92, "Lắp ráp chuỗi khung hình, đồng bộ âm thanh gốc và đóng gói MP4")
        self.renderer.render_video_from_frames(
            frames_dir=smoothed_dir,
            output_video_path=output_video_path,
            fps=fps,
            source_audio_video_path=template_source_video if template_source_video.is_file() else None,
            width=meta.get("width", 1080),
            height=meta.get("height", 1920),
        )

        # Extract representative thumbnail
        self.frame_extractor.extract_poster(output_video_path, output_thumb_path)

        logger.info("Model Personalization completed: %s", output_video_path)
        return output_video_path


# Global singleton instance
local_video_engine = VideoEngine()
