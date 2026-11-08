from pathlib import Path

import cv2
import numpy as np


class TemporalConsistencyService:
    """
    Applies temporal filtering and smoothing across consecutive synthesized frames
    to eliminate frame-to-frame flicker, identity drift, and boundary jitter.
    """

    def smooth_frames(
        self,
        frame_paths: list[Path],
        output_dir: Path,
        alpha: float = 0.85,
    ) -> list[Path]:
        output_dir.mkdir(parents=True, exist_ok=True)
        smoothed_paths: list[Path] = []
        prev_frame = None

        for idx, f_path in enumerate(frame_paths):
            curr = cv2.imread(str(f_path))
            if curr is None:
                continue

            if prev_frame is None or idx == 0:
                smoothed = curr
            else:
                # Temporal exponential smoothing
                smoothed = cv2.addWeighted(curr, alpha, prev_frame, 1.0 - alpha, 0)

            out_path = output_dir / f"frame_{idx:04d}.jpg"
            cv2.imwrite(str(out_path), smoothed)
            smoothed_paths.append(out_path)
            prev_frame = smoothed

        return smoothed_paths
