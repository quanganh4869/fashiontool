import math
from dataclasses import dataclass, field
from typing import Any

from app.services.video_engine.types import Keypoint, PoseFrame


@dataclass
class JointAngles:
    left_elbow: float    # degrees
    right_elbow: float
    left_shoulder: float
    right_shoulder: float
    left_knee: float
    right_knee: float
    left_hip: float
    right_hip: float
    torso_tilt: float


@dataclass
class NormalizedMotionFrame:
    frame_index: int
    timestamp_ms: int
    root_translation: tuple[float, float]
    scale_factor: float
    joint_angles: JointAngles
    limb_lengths: dict[str, float]


@dataclass
class MotionRetargetingArtifacts:
    total_frames: int
    normalized_frames: list[NormalizedMotionFrame]
    average_aspect_ratio: float
    retargeted_pose_sequence: list[PoseFrame]


class MotionRetargetingService:
    """
    Computes an independent geometric motion representation and retargets
    motion data to model profiles with varying physical proportions
    without limb deformation or distortion.
    """

    def _calculate_angle_3pts(self, a: Keypoint, b: Keypoint, c: Keypoint) -> float:
        """
        Calculates angle at vertex b between vectors ba and bc in degrees [0, 180].
        """
        v1 = (a.x - b.x, a.y - b.y)
        v2 = (c.x - b.x, c.y - b.y)

        dot = v1[0] * v2[0] + v1[1] * v2[1]
        mag1 = math.hypot(v1[0], v1[1])
        mag2 = math.hypot(v2[0], v2[1])

        if mag1 < 1e-5 or mag2 < 1e-5:
            return 180.0

        cos_angle = max(-1.0, min(1.0, dot / (mag1 * mag2)))
        return round(math.degrees(math.acos(cos_angle)), 2)

    def _dist(self, a: Keypoint, b: Keypoint) -> float:
        return math.hypot(a.x - b.x, a.y - b.y)

    def build_motion_representation(
        self,
        pose_sequence: list[PoseFrame],
        target_model_scale: float = 1.0,
    ) -> MotionRetargetingArtifacts:
        """
        Extracts joint angles and builds scale-invariant retargeted pose representations.
        """
        normalized_frames: list[NormalizedMotionFrame] = []
        retargeted_poses: list[PoseFrame] = []

        for p_idx, frame in enumerate(pose_sequence):
            if isinstance(frame.keypoints, dict):
                kp_dict = frame.keypoints
            else:
                kp_dict = {kp.name: kp for kp in frame.keypoints}

            # Check key anchor joints
            ls = kp_dict.get("left_shoulder")
            rs = kp_dict.get("right_shoulder")
            lh = kp_dict.get("left_hip")
            rh = kp_dict.get("right_hip")
            le = kp_dict.get("left_elbow")
            re = kp_dict.get("right_elbow")
            lw = kp_dict.get("left_wrist")
            rw = kp_dict.get("right_wrist")
            lk = kp_dict.get("left_knee")
            rk = kp_dict.get("right_knee")
            la = kp_dict.get("left_ankle")
            ra = kp_dict.get("right_ankle")

            # Fallbacks if any missing
            def safe_kp(k: Keypoint | None, default_x: float, default_y: float) -> Keypoint:
                return k if k else Keypoint(name="", x=default_x, y=default_y, confidence=0.0, visibility=False)

            ls = safe_kp(ls, 0.40, 0.25)
            rs = safe_kp(rs, 0.60, 0.25)
            lh = safe_kp(lh, 0.45, 0.55)
            rh = safe_kp(rh, 0.55, 0.55)
            le = safe_kp(le, 0.35, 0.38)
            re = safe_kp(re, 0.65, 0.38)
            lw = safe_kp(lw, 0.33, 0.50)
            rw = safe_kp(rw, 0.67, 0.50)
            lk = safe_kp(lk, 0.44, 0.75)
            rk = safe_kp(rk, 0.56, 0.75)
            la = safe_kp(la, 0.44, 0.95)
            ra = safe_kp(ra, 0.56, 0.95)

            # Torso measurements
            torso_cx = (ls.x + rs.x + lh.x + rh.x) / 4.0
            torso_cy = (ls.y + rs.y + lh.y + rh.y) / 4.0
            torso_h = max(0.1, (lh.y + rh.y) / 2.0 - (ls.y + rs.y) / 2.0)

            # Joint Angles
            angles = JointAngles(
                left_elbow=self._calculate_angle_3pts(ls, le, lw),
                right_elbow=self._calculate_angle_3pts(rs, re, rw),
                left_shoulder=self._calculate_angle_3pts(lh, ls, le),
                right_shoulder=self._calculate_angle_3pts(rh, rs, re),
                left_knee=self._calculate_angle_3pts(lh, lk, la),
                right_knee=self._calculate_angle_3pts(rh, rk, ra),
                left_hip=self._calculate_angle_3pts(ls, lh, lk),
                right_hip=self._calculate_angle_3pts(rs, rh, rk),
                torso_tilt=round(math.degrees(math.atan2((ls.y - rs.y), (rs.x - ls.x))), 2),
            )

            # Limb lengths relative to torso height
            limbs = {
                "upper_arm_l": round(self._dist(ls, le) / torso_h, 3),
                "forearm_l": round(self._dist(le, lw) / torso_h, 3),
                "thigh_l": round(self._dist(lh, lk) / torso_h, 3),
                "calf_l": round(self._dist(lk, la) / torso_h, 3),
            }

            norm_frame = NormalizedMotionFrame(
                frame_index=p_idx,
                timestamp_ms=frame.timestamp_ms,
                root_translation=(round(torso_cx, 4), round(torso_cy, 4)),
                scale_factor=round(torso_h, 4),
                joint_angles=angles,
                limb_lengths=limbs,
            )
            normalized_frames.append(norm_frame)

            # Retarget keypoints applying model scale preservation
            retargeted_kps: dict[str, Keypoint] = {}
            for name, orig_kp in kp_dict.items():
                # Relative displacement from torso center
                dx = (orig_kp.x - torso_cx) * target_model_scale
                dy = (orig_kp.y - torso_cy) * target_model_scale
                new_x = max(0.0, min(1.0, torso_cx + dx))
                new_y = max(0.0, min(1.0, torso_cy + dy))

                retargeted_kps[name] = Keypoint(
                    name=orig_kp.name,
                    x=round(new_x, 4),
                    y=round(new_y, 4),
                    confidence=orig_kp.confidence,
                    visibility=getattr(orig_kp, "visibility", True),
                )

            retargeted_poses.append(
                PoseFrame(
                    frame_index=frame.frame_index,
                    timestamp_ms=frame.timestamp_ms,
                    detected=frame.detected,
                    confidence=frame.confidence,
                    keypoints=retargeted_kps,
                    body_orientation=frame.body_orientation,
                    movement_vector=frame.movement_vector,
                    gesture=getattr(frame, "gesture", "standing"),
                )
            )

        return MotionRetargetingArtifacts(
            total_frames=len(pose_sequence),
            normalized_frames=normalized_frames,
            average_aspect_ratio=round(target_model_scale, 3),
            retargeted_pose_sequence=retargeted_poses,
        )
