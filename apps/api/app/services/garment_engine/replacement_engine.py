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
    6 buttons, left chest pocket, and fabric appearance.
    """

    def synthesize_garment_frame(
        self,
        base_frame: np.ndarray,
        garment_mask: np.ndarray,
        reference_features: ProductReferenceFeatures,
        structure: FrameGarmentStructure,
    ) -> np.ndarray:
        h, w = base_frame.shape[:2]
        result = base_frame.copy()

        # 1. Normalize garment mask
        if garment_mask.shape[:2] != (h, w):
            garment_mask = cv2.resize(garment_mask, (w, h))
        mask_f = (garment_mask.astype(np.float32) / 255.0)[:, :, None]

        # 2. Extract Shading / Luminance from Original Clothing
        # This preserves natural fabric folds, creases, and shadows
        base_gray = cv2.cvtColor(base_frame, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255.0
        # Normalize shading to range [0.75, 1.05] for white fabric rendering
        shading = cv2.GaussianBlur(base_gray, (15, 15), 0)
        shading = 0.80 + 0.25 * (shading - np.min(shading)) / max(1e-4, (np.max(shading) - np.min(shading)))
        shading = np.clip(shading, 0.70, 1.05)[:, :, None]

        # 3. Render Base Garment Fabric (e.g. Crisp White Shirt)
        target_color = np.array(reference_features.primary_color_bgr, dtype=np.float32)
        synthesized_cloth = np.ones((h, w, 3), dtype=np.float32) * target_color
        # Modulate with natural shading
        synthesized_cloth = np.clip(synthesized_cloth * shading, 0, 255).astype(np.uint8)

        # 4. Render Garment Structural Details on the Synthesized Fabric
        # Placket strip
        (p_x1, p_y1), (p_x2, p_y2) = structure.placket_line
        placket_w = max(4, int(w * 0.012))
        cv2.line(synthesized_cloth, (p_x1, p_y1), (p_x2, p_y2), (210, 210, 210), placket_w)
        cv2.line(synthesized_cloth, (p_x1 - placket_w // 2, p_y1), (p_x1 - placket_w // 2, p_y2), (195, 195, 195), 1)
        cv2.line(synthesized_cloth, (p_x1 + placket_w // 2, p_y1), (p_x1 + placket_w // 2, p_y2), (195, 195, 195), 1)

        # Left Chest Pocket
        if structure.pocket:
            pk = structure.pocket
            # Pocket outline
            cv2.rectangle(synthesized_cloth, (pk.x1, pk.y1), (pk.x2, pk.y2), (200, 200, 200), 2)
            # Top pocket hem line
            cv2.line(synthesized_cloth, (pk.x1, pk.y1 + 5), (pk.x2, pk.y1 + 5), (180, 180, 180), 1)

        # Collar lines (Pointed collar)
        col = structure.collar
        cv2.line(synthesized_cloth, col.center_notch, col.left_tip, (180, 180, 180), 2)
        cv2.line(synthesized_cloth, col.center_notch, col.right_tip, (180, 180, 180), 2)

        # 5. Render Exact 6 Invariant Buttons
        for btn in structure.buttons:
            # Button rim shadow
            cv2.circle(synthesized_cloth, (btn.x, btn.y + 1), btn.radius + 1, (160, 160, 160), -1)
            # Button body
            cv2.circle(synthesized_cloth, (btn.x, btn.y), btn.radius, btn.color_bgr, -1)
            # Inner button holes
            hole_r = max(1, btn.radius // 3)
            cv2.circle(synthesized_cloth, (btn.x - 1, btn.y - 1), hole_r, (150, 150, 150), -1)
            cv2.circle(synthesized_cloth, (btn.x + 1, btn.y + 1), hole_r, (150, 150, 150), -1)

        # 6. Feathered Alpha Blend into Target Garment Region
        # Only modify the pixels within garment_mask; background, head, skin, hands remain intact
        ksize = 9
        mask_feathered = cv2.GaussianBlur(mask_f, (ksize, ksize), 0)[:, :, None] if len(mask_f.shape) == 2 else cv2.GaussianBlur(mask_f, (ksize, ksize), 0)
        if len(mask_feathered.shape) == 2:
            mask_feathered = mask_feathered[:, :, None]

        blended = (synthesized_cloth.astype(np.float32) * mask_feathered +
                   base_frame.astype(np.float32) * (1.0 - mask_feathered))

        return np.clip(blended, 0, 255).astype(np.uint8)
