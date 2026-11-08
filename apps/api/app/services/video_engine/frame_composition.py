import math
from pathlib import Path
from typing import Any

import cv2
import numpy as np

from .types import PoseFrame


class FrameCompositionService:
    """
    Synthesizes identity-conditioned frames: retargets the Model Profile's
    visual identity (face, hair, skin tone) to the driving skeleton pose
    while preserving scene background and body orientation.
    """

    def compose_frame(
        self,
        source_frame_path: Path,
        mask_path: Path | None,
        pose: PoseFrame,
        identity_data: dict[str, Any],
        output_frame_path: Path,
    ) -> Path:
        output_frame_path.parent.mkdir(parents=True, exist_ok=True)

        src_img = cv2.imread(str(source_frame_path))
        if src_img is None:
            raise FileNotFoundError(f"Source frame not found: {source_frame_path}")

        h, w = src_img.shape[:2]
        canvas = src_img.copy()

        face_crop = identity_data.get("face_crop")
        if face_crop is not None and face_crop.size > 0:
            kps = pose.keypoints
            nose = kps.get("nose")
            l_sh = kps.get("left_shoulder")
            r_sh = kps.get("right_shoulder")

            if nose and l_sh and r_sh:
                # 1. Shoulder width & tilt angle
                dx = (r_sh.x - l_sh.x) * w
                dy = (r_sh.y - l_sh.y) * h
                sh_dist = np.sqrt(dx ** 2 + dy ** 2)
                tilt_angle = math.degrees(math.atan2(dy, dx))

                # 2. Target head proportions
                target_head_w = int(max(44, sh_dist * 0.72))
                target_head_h = int(target_head_w * 1.32)

                # Target center based on nose coordinates
                target_cx = int(nose.x * w)
                target_cy = int((nose.y - 0.02) * h)

                tx1 = max(0, target_cx - target_head_w // 2)
                ty1 = max(0, target_cy - target_head_h // 2)
                tx2 = min(w, tx1 + target_head_w)
                ty2 = min(h, ty1 + target_head_h)
                actual_w = tx2 - tx1
                actual_h = ty2 - ty1

                if actual_w > 12 and actual_h > 12:
                    # 3. Rotate and resize face crop matching pose tilt
                    center_pt = (face_crop.shape[1] // 2, face_crop.shape[0] // 2)
                    rot_mat = cv2.getRotationMatrix2D(center_pt, tilt_angle * 0.35, 1.0)
                    rotated_face = cv2.warpAffine(
                        face_crop,
                        rot_mat,
                        (face_crop.shape[1], face_crop.shape[0]),
                        flags=cv2.INTER_LANCZOS4,
                        borderMode=cv2.BORDER_REPLICATE,
                    )

                    resized_face = cv2.resize(rotated_face, (actual_w, actual_h), interpolation=cv2.INTER_LANCZOS4)

                    # 4. Color / Illumination transfer to harmonize with target scene lighting
                    bg_roi = canvas[ty1:ty2, tx1:tx2].astype(np.float32)
                    fg_roi = resized_face.astype(np.float32)

                    bg_mean = np.mean(bg_roi, axis=(0, 1), keepdims=True)
                    fg_mean = np.mean(fg_roi, axis=(0, 1), keepdims=True)
                    # Gentle light modulation (30% pull toward background scene tone)
                    harmonized_fg = np.clip(fg_roi + (bg_mean - fg_mean) * 0.28, 0, 255)

                    # 5. Dual-concentric elliptical soft alpha mask
                    alpha_mask = np.zeros((actual_h, actual_w), dtype=np.float32)
                    cv2.ellipse(
                        alpha_mask,
                        (actual_w // 2, actual_h // 2),
                        (actual_w // 2 - 3, actual_h // 2 - 3),
                        0,
                        0,
                        360,
                        1.0,
                        -1,
                    )
                    alpha_mask = cv2.GaussianBlur(alpha_mask, (25, 25), 9)
                    alpha = np.expand_dims(alpha_mask, axis=-1)

                    # 6. Smooth blend
                    blended = (harmonized_fg * alpha + bg_roi * (1.0 - alpha)).astype(np.uint8)
                    canvas[ty1:ty2, tx1:tx2] = blended

        cv2.imwrite(str(output_frame_path), canvas)
        return output_frame_path
