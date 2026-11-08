import logging
from pathlib import Path

import cv2
import numpy as np

logger = logging.getLogger(__name__)


class OcclusionHandlingService:
    """
    Guarantees proper foreground depth layering so that hands crossing the body,
    hair resting over shoulders, and accessories remain in front of the new clothing.
    """

    def apply_foreground_occlusions(
        self,
        synthesized_frame: np.ndarray,
        original_base_frame: np.ndarray,
        occlusion_mask: np.ndarray,
    ) -> np.ndarray:
        """
        Overlays original foreground hands, hair, and accessories over the synthesized frame.
        """
        if occlusion_mask is None or cv2.countNonZero(occlusion_mask) == 0:
            return synthesized_frame

        h, w = synthesized_frame.shape[:2]
        if occlusion_mask.shape[:2] != (h, w):
            occlusion_mask = cv2.resize(occlusion_mask, (w, h))

        # Soft feathering on occlusion boundary
        occ_f = cv2.GaussianBlur(occlusion_mask.astype(np.float32) / 255.0, (5, 5), 0)[:, :, None]

        # Re-layer: foreground pixels from original frame
        composited = (original_base_frame.astype(np.float32) * occ_f +
                      synthesized_frame.astype(np.float32) * (1.0 - occ_f))

        return np.clip(composited, 0, 255).astype(np.uint8)
