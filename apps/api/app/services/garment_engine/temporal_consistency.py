import logging
from pathlib import Path

import cv2
import numpy as np

logger = logging.getLogger(__name__)


class GarmentTemporalConsistencyService:
    """
    Applies exponential moving average (EMA) temporal filtering across synthesized frames
    to ensure stable button rendering, steady fabric color, and seamless edge boundaries.
    """

    def __init__(self, alpha: float = 0.88):
        self.alpha = alpha

    def smooth_sequence(
        self,
        frame_paths: list[Path],
        output_dir: Path,
        alpha: float | None = None,
    ) -> list[Path]:
        output_dir.mkdir(parents=True, exist_ok=True)
        smoothed_paths: list[Path] = []
        prev_frame: np.ndarray | None = None
        effective_alpha = self.alpha if alpha is None else alpha

        for idx, f_path in enumerate(frame_paths):
            curr_frame = cv2.imread(str(f_path))
            if curr_frame is None:
                continue

            if prev_frame is None or idx == 0:
                smoothed = curr_frame
            else:
                # Weighted temporal smoothing
                smoothed = cv2.addWeighted(curr_frame, effective_alpha, prev_frame, 1.0 - effective_alpha, 0)

            out_f = output_dir / f"frame_{idx:04d}.jpg"
            cv2.imwrite(str(out_f), smoothed, [cv2.IMWRITE_JPEG_QUALITY, 95])
            smoothed_paths.append(out_f)
            prev_frame = smoothed

        return smoothed_paths
