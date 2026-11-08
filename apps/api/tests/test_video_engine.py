import shutil
from pathlib import Path

import numpy as np
import pytest

from app.services.video_engine import (
    CompositingService,
    Keypoint,
    ModelRuntimeManager,
    MotionRetargetingService,
    PersonTrackingService,
    PoseFrame,
    VideoEngine,
    local_video_engine,
)


def test_model_runtime_diagnostics():
    runtime = ModelRuntimeManager()
    diag = runtime.get_hardware_diagnostics()

    assert "platform" in diag
    assert "cpu_count_logical" in diag
    assert "total_ram_gb" in diag
    assert diag["selected_device"] in ("cuda", "cpu")
    assert Path(diag["models_root"]).is_dir()

    # Test memory cleanup does not raise
    runtime.cleanup_memory()


def test_person_tracking_service():
    tracker = PersonTrackingService(iou_threshold=0.3)

    # Fake frames & poses
    frame_records = [{"frame_index": i, "timestamp_ms": i * 66} for i in range(5)]
    kps = [
        Keypoint(name="nose", x=0.5, y=0.15, confidence=0.9, visibility=True),
        Keypoint(name="left_shoulder", x=0.42, y=0.28, confidence=0.88, visibility=True),
        Keypoint(name="right_shoulder", x=0.58, y=0.28, confidence=0.88, visibility=True),
        Keypoint(name="left_hip", x=0.45, y=0.55, confidence=0.85, visibility=True),
        Keypoint(name="right_hip", x=0.55, y=0.55, confidence=0.85, visibility=True),
    ]
    pose_sequence = [
        PoseFrame(
            frame_index=i,
            timestamp_ms=i * 66,
            detected=True,
            confidence=0.85,
            keypoints={k.name: k for k in kps},
            body_orientation="facing_front",
            movement_vector=(0.0, 0.0),
            gesture="walking",
        )
        for i in range(5)
    ]

    artifacts = tracker.track_subject(frame_records, pose_sequence)
    assert artifacts.primary_tracking_id == "person_001"
    assert artifacts.total_frames == 5
    assert len(artifacts.tracked_frames) == 5
    assert artifacts.continuous_tracking_ratio > 0.8
    assert artifacts.tracked_frames[0].bbox.width > 0.0


def test_motion_retargeting_service():
    retargeter = MotionRetargetingService()

    kps = [
        Keypoint(name="left_shoulder", x=0.4, y=0.25, confidence=0.9, visibility=True),
        Keypoint(name="right_shoulder", x=0.6, y=0.25, confidence=0.9, visibility=True),
        Keypoint(name="left_elbow", x=0.35, y=0.4, confidence=0.9, visibility=True),
        Keypoint(name="left_wrist", x=0.33, y=0.55, confidence=0.9, visibility=True),
        Keypoint(name="left_hip", x=0.45, y=0.55, confidence=0.9, visibility=True),
        Keypoint(name="right_hip", x=0.55, y=0.55, confidence=0.9, visibility=True),
        Keypoint(name="left_knee", x=0.44, y=0.75, confidence=0.9, visibility=True),
        Keypoint(name="left_ankle", x=0.44, y=0.95, confidence=0.9, visibility=True),
    ]
    poses = [
        PoseFrame(
            frame_index=0,
            timestamp_ms=0,
            detected=True,
            confidence=0.9,
            keypoints={k.name: k for k in kps},
            body_orientation="facing_front",
            movement_vector=(0.0, 0.0),
            gesture="walking",
        )
    ]

    artifacts = retargeter.build_motion_representation(poses, target_model_scale=1.05)
    assert artifacts.total_frames == 1
    assert len(artifacts.normalized_frames) == 1
    norm_f = artifacts.normalized_frames[0]
    assert 0 <= norm_f.joint_angles.left_elbow <= 180
    assert len(artifacts.retargeted_pose_sequence) == 1


def test_compositing_service():
    compositor = CompositingService(feather_radius=5)

    src_img = np.zeros((100, 100, 3), dtype=np.uint8) + 50
    syn_img = np.zeros((100, 100, 3), dtype=np.uint8) + 200
    mask = np.zeros((100, 100), dtype=np.uint8)
    mask[25:75, 25:75] = 255

    blended = compositor.blend_subject_with_background(src_img, syn_img, mask)
    assert blended.shape == (100, 100, 3)
    # The center should be influenced by syn_img (> 50)
    assert blended[50, 50, 0] > 50


def test_real_template_analysis_and_contact_sheet(tmp_path: Path):
    candidates = [
        Path("data/storage/templates/vtp-streetwear-001/versions/v1/source/source.mp4"),
        Path("../../data/storage/templates/vtp-streetwear-001/versions/v1/source/source.mp4"),
        Path("../data/storage/templates/vtp-streetwear-001/versions/v1/source/source.mp4"),
    ]
    source_video = next((p for p in candidates if p.is_file()), None)
    if not source_video:
        pytest.skip("Physical source video not found at test path")

    analysis_dir = tmp_path / "analysis"
    artifacts = local_video_engine.analyze_template_video(
        template_id="test_tmpl",
        video_path=source_video,
        analysis_root_dir=analysis_dir,
        max_fps=15,
    )

    assert artifacts.total_frames > 0
    assert (analysis_dir / "metadata.json").is_file()
    assert (analysis_dir / "scenes.json").is_file()
    assert (analysis_dir / "pose_sequence.json").is_file()
    assert (analysis_dir / "tracking.json").is_file()
    assert (analysis_dir / "motion_representation.json").is_file()

    # Test Contact Sheet Generator on the video
    sheet_out = tmp_path / "contact_sheet.jpg"
    local_video_engine.renderer.generate_contact_sheet(source_video, sheet_out)
    assert sheet_out.is_file()
    assert sheet_out.stat().st_size > 0

    # Test SHA-256 computation
    sha = local_video_engine.renderer.get_file_sha256(source_video)
    assert len(sha) == 64
