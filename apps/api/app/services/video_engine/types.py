from dataclasses import dataclass, field
from typing import Any


@dataclass
class Keypoint:
    name: str
    x: float  # Normalized [0, 1]
    y: float  # Normalized [0, 1]
    confidence: float
    visibility: bool = True


@dataclass
class PoseFrame:
    frame_index: int
    timestamp_ms: int
    keypoints: dict[str, Keypoint]
    body_orientation: str  # front, three_quarter_left, three_quarter_right, profile_left, profile_right, back
    movement_vector: tuple[float, float]  # (dx, dy)
    gesture: str  # walking, turning, posing, stationary
    detected: bool = True
    confidence: float = 1.0


@dataclass
class SceneInfo:
    scene_id: str
    scene_order: int
    start_time_ms: int
    end_time_ms: int
    framing: str  # full_body, medium_shot, close_up
    camera_movement: str  # tracking_forward, tracking_backward, static, pan_horizontal
    action_description: str
    subject_visibility: str


@dataclass
class GarmentSlotAnalysis:
    slot_id: str
    slot_type: str  # upper_body, lower_body, dress_full_body
    slot_name: str
    bbox: list[int]  # [x, y, w, h]
    confidence: float
    assessment_status: str  # SUPPORTED, LIMITED, UNSUPPORTED


@dataclass
class VideoAnalysisArtifacts:
    template_id: str
    video_path: str
    duration_ms: int
    width: int
    height: int
    aspect_ratio: str
    frame_rate: int
    total_frames: int
    scenes: list[SceneInfo] = field(default_factory=list)
    pose_sequence: list[PoseFrame] = field(default_factory=list)
    garment_slots: list[GarmentSlotAnalysis] = field(default_factory=list)
    frames_dir: str = ""
    skeletons_dir: str = ""
    masks_dir: str = ""
    poster_path: str = ""
    diagnostics: dict[str, Any] = field(default_factory=dict)
