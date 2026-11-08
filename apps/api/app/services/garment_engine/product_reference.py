import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import cv2
import numpy as np

from app.schemas.replacements import ProductTruthSheetSpec

logger = logging.getLogger(__name__)


@dataclass
class ProductReferenceFeatures:
    primary_color_bgr: tuple[int, int, int]
    fabric_texture_sample: np.ndarray
    collar_type: str
    button_count: int
    button_color_bgr: tuple[int, int, int]
    has_left_pocket: bool
    sleeve_type: str
    cuff_buttons: int
    pattern: str


class ProductReferenceService:
    """
    Extracts high-fidelity visual representations from Product Asset images
    guided by the approved Product Truth Sheet.
    """

    def prepare_reference(
        self,
        product_images: list[Path],
        truth_sheet: ProductTruthSheetSpec,
    ) -> ProductReferenceFeatures:
        # Default colors
        primary_bgr = (245, 245, 245)  # Crisp pure white shirt
        button_bgr = (230, 230, 230)   # Matching white round buttons

        # If reference images exist, sample dominant fabric color and texture
        texture_sample = np.zeros((128, 128, 3), dtype=np.uint8) + 245

        if product_images and product_images[0].is_file():
            primary_img = cv2.imread(str(product_images[0]))
            if primary_img is not None:
                h, w = primary_img.shape[:2]
                # Center torso crop for pure fabric texture
                cy1, cy2 = int(h * 0.4), int(h * 0.6)
                cx1, cx2 = int(w * 0.4), int(w * 0.6)
                crop = primary_img[cy1:cy2, cx1:cx2]
                if crop.size > 0:
                    texture_sample = cv2.resize(crop, (128, 128))
                    # Sample mean BGR
                    mean_color = cv2.mean(texture_sample)[:3]
                    primary_bgr = (int(mean_color[0]), int(mean_color[1]), int(mean_color[2]))

        # Handle specific primary_color hex if provided
        if truth_sheet.primary_color and truth_sheet.primary_color.startswith("#"):
            hex_val = truth_sheet.primary_color.lstrip("#")
            if len(hex_val) == 6:
                r = int(hex_val[0:2], 16)
                g = int(hex_val[2:4], 16)
                b = int(hex_val[4:6], 16)
                primary_bgr = (b, g, r)

        return ProductReferenceFeatures(
            primary_color_bgr=primary_bgr,
            fabric_texture_sample=texture_sample,
            collar_type=truth_sheet.collar_type,
            button_count=truth_sheet.button_count,
            button_color_bgr=button_bgr,
            has_left_pocket=truth_sheet.has_left_pocket,
            sleeve_type=truth_sheet.sleeve_type,
            cuff_buttons=truth_sheet.cuff_buttons,
            pattern=truth_sheet.pattern,
        )
