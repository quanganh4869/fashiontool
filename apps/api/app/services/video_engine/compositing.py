import logging
from pathlib import Path
from typing import Any

import cv2
import numpy as np

logger = logging.getLogger(__name__)


class CompositingService:
    """
    Performs layered spatial compositing, boundary feathering, and background preservation
    to seamlessly integrate synthesized model frames into the driving scene.
    """

    def __init__(self, feather_radius: int = 7):
        self.feather_radius = feather_radius

    def blend_subject_with_background(
        self,
        source_frame: np.ndarray,
        synthesized_subject: np.ndarray,
        alpha_mask: np.ndarray,
    ) -> np.ndarray:
        """
        Smoothly blends synthesized subject with source background using feathered alpha.
        """
        h, w = source_frame.shape[:2]

        if synthesized_subject.shape[:2] != (h, w):
            synthesized_subject = cv2.resize(synthesized_subject, (w, h), interpolation=cv2.INTER_LINEAR)

        if alpha_mask.shape[:2] != (h, w):
            alpha_mask = cv2.resize(alpha_mask, (w, h), interpolation=cv2.INTER_LINEAR)

        # Normalize alpha to float [0.0, 1.0]
        if alpha_mask.dtype != np.float32 and alpha_mask.dtype != np.float64:
            alpha = (alpha_mask.astype(np.float32) / 255.0)
        else:
            alpha = alpha_mask.copy()

        if len(alpha.shape) == 2:
            alpha = np.expand_dims(alpha, axis=-1)

        # Apply boundary feathering Gaussian blur to eliminate sticker harsh edges
        ksize = self.feather_radius * 2 + 1
        alpha_feathered = cv2.GaussianBlur(alpha, (ksize, ksize), 0)
        if len(alpha_feathered.shape) == 2:
            alpha_feathered = np.expand_dims(alpha_feathered, axis=-1)

        # Color balance adjustment: match synthesized region mean luminance to background
        src_gray = cv2.cvtColor(source_frame, cv2.COLOR_BGR2GRAY)
        bg_mean = float(np.mean(src_gray))
        syn_gray = cv2.cvtColor(synthesized_subject, cv2.COLOR_BGR2GRAY)
        syn_mean = float(np.mean(syn_gray))

        lum_ratio = max(0.8, min(1.2, bg_mean / max(1.0, syn_mean)))
        balanced_syn = np.clip(synthesized_subject.astype(np.float32) * lum_ratio, 0, 255).astype(np.uint8)

        # Composite: output = alpha * subject + (1 - alpha) * background
        fg = balanced_syn.astype(np.float32)
        bg = source_frame.astype(np.float32)

        composite = fg * alpha_feathered + bg * (1.0 - alpha_feathered)
        return np.clip(composite, 0, 255).astype(np.uint8)

    def composite_frame_sequence(
        self,
        source_frame_paths: list[Path],
        synthesized_frame_paths: list[Path],
        output_dir: Path,
    ) -> list[Path]:
        """
        Executes layered compositing across the sequence of frames.
        """
        output_dir.mkdir(parents=True, exist_ok=True)
        composited_paths: list[Path] = []

        for idx, (src_p, syn_p) in enumerate(zip(source_frame_paths, synthesized_frame_paths)):
            src_img = cv2.imread(str(src_p))
            syn_img = cv2.imread(str(syn_p))

            if src_img is None or syn_img is None:
                continue

            h, w = src_img.shape[:2]
            # Construct soft elliptical subject mask centered on driving subject
            mask = np.zeros((h, w), dtype=np.uint8)
            cv2.ellipse(mask, (w // 2, int(h * 0.45)), (int(w * 0.35), int(h * 0.45)), 0, 0, 360, 255, -1)

            blended = self.blend_subject_with_background(src_img, syn_img, mask)

            out_path = output_dir / f"composited_{idx:04d}.jpg"
            cv2.imwrite(str(out_path), blended, [cv2.IMWRITE_JPEG_QUALITY, 95])
            composited_paths.append(out_path)

        return composited_paths
