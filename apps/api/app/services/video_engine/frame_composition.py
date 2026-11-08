from pathlib import Path
from typing import Any

import cv2
import numpy as np

from .types import PoseFrame


class FrameCompositionService:
    """
    Synthesizes identity-conditioned frames: retargets the Model Profile's
    visual identity to the driving skeleton pose while preserving scene background.
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
                # Calculate target head size based on shoulder width
                sh_dist = np.sqrt(((r_sh.x - l_sh.x) * w) ** 2 + ((r_sh.y - l_sh.y) * h) ** 2)
                target_head_w = int(max(40, sh_dist * 0.75))
                target_head_h = int(target_head_w * 1.3)

                # Target center at nose position
                target_cx = int(nose.x * w)
                target_cy = int((nose.y - 0.02) * h)

                tx1 = max(0, target_cx - target_head_w // 2)
                ty1 = max(0, target_cy - target_head_h // 2)
                tx2 = min(w, tx1 + target_head_w)
                ty2 = min(h, ty1 + target_head_h)
                actual_w = tx2 - tx1
                actual_h = ty2 - ty1

                if actual_w > 10 and actual_h > 10:
                    # Resize model face crop to driving pose scale
                    resized_face = cv2.resize(face_crop, (actual_w, actual_h), interpolation=cv2.INTER_LANCZOS4)

                    # Create soft elliptical alpha mask for seamless blending
                    alpha_mask = np.zeros((actual_h, actual_w), dtype=np.float32)
                    cv2.ellipse(
                        alpha_mask,
                        (actual_w // 2, actual_h // 2),
                        (actual_w // 2 - 2, actual_h // 2 - 2),
                        0, 0, 360, 1.0, -1
                    )
                    alpha_mask = cv2.GaussianBlur(alpha_mask, (21, 21), 8)

                    # Blend into background
                    bg_roi = canvas[ty1:ty2, tx1:tx2].astype(np.float32)
                    fg_roi = resized_face.astype(np.float32)
                    alpha = np.expand_dims(alpha_mask, axis=-1)

                    blended = (fg_roi * alpha + bg_roi * (1.0 - alpha)).astype(np.uint8)
                    canvas[ty1:ty2, tx1:tx2] = blended

        cv2.imwrite(str(output_frame_path), canvas)
        return output_frame_path
