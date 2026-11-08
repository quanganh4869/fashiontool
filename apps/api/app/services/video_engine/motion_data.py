import json
from dataclasses import asdict
from pathlib import Path

from .types import VideoAnalysisArtifacts


class MotionDataService:
    """
    Manages persistent storage and retrieval of motion analysis artifacts
    on the local filesystem.
    """

    def save_artifacts(self, artifacts: VideoAnalysisArtifacts, target_dir: Path) -> None:
        target_dir.mkdir(parents=True, exist_ok=True)

        # 1. Metadata
        meta = {
            "template_id": artifacts.template_id,
            "video_path": artifacts.video_path,
            "duration_ms": artifacts.duration_ms,
            "width": artifacts.width,
            "height": artifacts.height,
            "aspect_ratio": artifacts.aspect_ratio,
            "frame_rate": artifacts.frame_rate,
            "total_frames": artifacts.total_frames,
            "poster_path": artifacts.poster_path,
            "frames_dir": artifacts.frames_dir,
            "skeletons_dir": artifacts.skeletons_dir,
            "masks_dir": artifacts.masks_dir,
        }
        (target_dir / "metadata.json").write_text(
            json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8"
        )

        # 2. Scenes
        scenes_data = [asdict(s) for s in artifacts.scenes]
        (target_dir / "scenes.json").write_text(
            json.dumps(scenes_data, indent=2, ensure_ascii=False), encoding="utf-8"
        )

        # 3. Pose Sequence
        poses_data = [asdict(p) for p in artifacts.pose_sequence]
        (target_dir / "pose_sequence.json").write_text(
            json.dumps(poses_data, indent=2, ensure_ascii=False), encoding="utf-8"
        )

        # 4. Garment Slots
        slots_data = [asdict(g) for g in artifacts.garment_slots]
        (target_dir / "garment_slots.json").write_text(
            json.dumps(slots_data, indent=2, ensure_ascii=False), encoding="utf-8"
        )

        # 5. Diagnostics
        (target_dir / "diagnostics.json").write_text(
            json.dumps(artifacts.diagnostics, indent=2, ensure_ascii=False), encoding="utf-8"
        )

    def load_artifacts(self, target_dir: Path) -> dict:
        if not target_dir.is_dir():
            raise FileNotFoundError(f"Analysis directory not found: {target_dir}")

        meta = json.loads((target_dir / "metadata.json").read_text(encoding="utf-8"))
        scenes = json.loads((target_dir / "scenes.json").read_text(encoding="utf-8"))
        poses = json.loads((target_dir / "pose_sequence.json").read_text(encoding="utf-8"))
        slots = json.loads((target_dir / "garment_slots.json").read_text(encoding="utf-8"))
        diag = json.loads((target_dir / "diagnostics.json").read_text(encoding="utf-8")) if (target_dir / "diagnostics.json").exists() else {}

        return {
            "metadata": meta,
            "scenes": scenes,
            "pose_sequence": poses,
            "garment_slots": slots,
            "diagnostics": diag,
        }
