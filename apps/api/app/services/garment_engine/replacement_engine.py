import logging
from pathlib import Path
from typing import Any

import cv2
import numpy as np

from .garment_structure import FrameGarmentStructure
from .product_reference import ProductReferenceFeatures

logger = logging.getLogger(__name__)


class GarmentReplacementEngine:
    """
    Core synthesis engine that replaces the garment region in each video frame
    with exact product details: color, pointed collar, front placket,
    6 buttons, left chest pocket, and natural woven fabric appearance.
    """

    def synthesize_garment_frame(
        self,
        base_frame: np.ndarray,
        garment_mask: np.ndarray,
        reference_features: ProductReferenceFeatures,
        structure: FrameGarmentStructure,
        add_weave_texture: bool = True,
    ) -> np.ndarray:
        h, w = base_frame.shape[:2]
        result = base_frame.copy()

        # 1. Normalize garment mask
        if garment_mask.shape[:2] != (h, w):
            garment_mask = cv2.resize(garment_mask, (w, h))
        mask_f = (garment_mask.astype(np.float32) / 255.0)[:, :, None]

        # 2. Extract Shading / Luminance from Original Clothing
        # Preserves natural folds, wrinkles, chest volume, and lighting gradients
        base_gray = cv2.cvtColor(base_frame, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255.0
        shading = cv2.GaussianBlur(base_gray, (15, 15), 0)
        min_v = np.min(shading)
        max_v = np.max(shading)
        shading = 0.80 + 0.25 * (shading - min_v) / max(1e-4, (max_v - min_v))
        shading = np.clip(shading, 0.72, 1.05)[:, :, None]

        # 3. Micro-grain Woven Fabric Texture (Crisp Cotton Weave)
        if add_weave_texture:
            np.random.seed(structure.frame_index % 1000)
            noise = np.random.normal(0.0, 1.5, (h, w, 1)).astype(np.float32)
            noise_blur = cv2.GaussianBlur(noise, (3, 3), 0)[:, :, None] if len(noise.shape) == 2 else cv2.GaussianBlur(noise, (3, 3), 0)
            if len(noise_blur.shape) == 2:
                noise_blur = noise_blur[:, :, None]
        else:
            noise_blur = np.zeros((h, w, 1), dtype=np.float32)

        # 4. Render Base Garment Fabric
        target_color = np.array(reference_features.primary_color_bgr, dtype=np.float32)
        synthesized_cloth = np.ones((h, w, 3), dtype=np.float32) * target_color
        # Modulate with shading and microscopic fabric grain
        synthesized_cloth = np.clip((synthesized_cloth + noise_blur) * shading, 0, 255).astype(np.uint8)

        # 5. Render Placket Strip (Center Seam)
        (p_x1, p_y1), (p_x2, p_y2) = structure.placket_line
        placket_w = max(4, int(w * 0.012))
        cv2.line(synthesized_cloth, (p_x1, p_y1), (p_x2, p_y2), (215, 215, 215), placket_w)
        cv2.line(synthesized_cloth, (p_x1 - placket_w // 2, p_y1), (p_x1 - placket_w // 2, p_y2), (195, 195, 195), 1)
        cv2.line(synthesized_cloth, (p_x1 + placket_w // 2, p_y1), (p_x1 + placket_w // 2, p_y2), (195, 195, 195), 1)

        # 6. Render Left Chest Pocket
        if structure.pocket:
            pk = structure.pocket
            # Outer pocket patch seam
            cv2.rectangle(synthesized_cloth, (pk.x1, pk.y1), (pk.x2, pk.y2), (200, 200, 200), 2)
            # Top pocket hem line (double stitch)
            cv2.line(synthesized_cloth, (pk.x1, pk.hem_y), (pk.x2, pk.hem_y), (180, 180, 180), 1)
            cv2.line(synthesized_cloth, (pk.x1, pk.hem_y + 3), (pk.x2, pk.hem_y + 3), (190, 190, 190), 1)

        # 7. Render Pointed Collar Wings
        col = structure.collar
        cv2.line(synthesized_cloth, col.center_notch, col.left_tip, (180, 180, 180), 2)
        cv2.line(synthesized_cloth, col.center_notch, col.right_tip, (180, 180, 180), 2)
        # Inner fold line
        fold_y = col.center_notch[1] + 6
        cv2.line(synthesized_cloth, (col.left_tip[0] + 6, col.left_tip[1]), (col.center_notch[0], fold_y), (210, 210, 210), 1)
        cv2.line(synthesized_cloth, (col.right_tip[0] - 6, col.right_tip[1]), (col.center_notch[0], fold_y), (210, 210, 210), 1)

        # 8. Render Exact 6 Invariant Buttons (Realistic 3D Buttons)
        for btn in structure.buttons:
            # Button drop shadow
            cv2.circle(synthesized_cloth, (btn.x + btn.shadow_offset[0], btn.y + btn.shadow_offset[1]), btn.radius + 1, (160, 160, 160), -1)
            # Button outer rim
            cv2.circle(synthesized_cloth, (btn.x, btn.y), btn.radius, (210, 210, 210), -1)
            # Button face
            cv2.circle(synthesized_cloth, (btn.x, btn.y), max(1, btn.radius - 1), btn.color_bgr, -1)
            # Specular highlight
            cv2.circle(synthesized_cloth, (btn.x + btn.highlight_offset[0], btn.y + btn.highlight_offset[1]), max(1, btn.radius // 3), (255, 255, 255), -1)
            # Inner stitched thread holes (dual eyelets)
            hole_r = max(1, btn.radius // 4)
            cv2.circle(synthesized_cloth, (btn.x, btn.y - max(1, btn.radius // 3)), hole_r, (140, 140, 140), -1)
            cv2.circle(synthesized_cloth, (btn.x, btn.y + max(1, btn.radius // 3)), hole_r, (140, 140, 140), -1)

        # 9. Feathered Edge Blending into Target Garment Region
        # Only modify the pixels within garment_mask; skin, hands, face and background remain untouched
        ksize = 11
        mask_feathered = cv2.GaussianBlur(mask_f, (ksize, ksize), 0)
        if len(mask_feathered.shape) == 2:
            mask_feathered = mask_feathered[:, :, None]

        blended = (synthesized_cloth.astype(np.float32) * mask_feathered +
                   base_frame.astype(np.float32) * (1.0 - mask_feathered))

        return np.clip(blended, 0, 255).astype(np.uint8)
