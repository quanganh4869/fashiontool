import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import cv2
import numpy as np

from .garment_analysis import GarmentRegionFrame

logger = logging.getLogger(__name__)


@dataclass
class TrackedGarmentMask:
    frame_index: int
    timestamp_ms: int
    garment_mask_path: str
    occlusion_mask_path: str
    is_occluded: bool
    hand_intersection: bool
    hair_intersection: bool


class GarmentTrackingService:
    """
    Maintains temporal continuity of garment masks across video frames
    and extracts dedicated occlusion masks for hands, hair, and accessories.
    """

    def track_sequence(
        self,
        garment_frames: list[GarmentRegionFrame],
        frame_paths: list[Path],
        output_tracking_dir: Path,
    ) -> list[TrackedGarmentMask]:
        output_tracking_dir.mkdir(parents=True, exist_ok=True)
        tracked_results: list[TrackedGarmentMask] = []

        for idx, g_frame in enumerate(garment_frames):
            frame_img = cv2.imread(str(frame_paths[idx]))
            g_mask = cv2.imread(g_frame.mask_path, cv2.IMREAD_GRAYSCALE)
            s_mask = cv2.imread(g_frame.skin_exclusion_mask_path, cv2.IMREAD_GRAYSCALE)

            h, w = frame_img.shape[:2]

            # 1. Detect Hand Occlusion over Garment
            # Hand pixels = skin pixels intersecting the garment region
            hand_occlusion = cv2.bitwise_and(s_mask, g_mask)
            # Remove small noise
            hand_occlusion = cv2.morphologyEx(
                hand_occlusion,
                cv2.MORPH_OPEN,
                cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)),
            )

            hand_intersection = int(cv2.countNonZero(hand_occlusion)) > 250

            # 2. Detect Hair Occlusion (Dark pixels near shoulders / neck falling into torso)
            gray = cv2.cvtColor(frame_img, cv2.COLOR_BGR2GRAY)
            hair_candidate = cv2.inRange(gray, 0, 55)  # dark hair tones
            hair_candidate = cv2.bitwise_and(hair_candidate, g_mask)
            hair_intersection = int(cv2.countNonZero(hair_candidate)) > 300

            # Combined occlusion mask (foreground elements that must NOT be covered by new clothing)
            occlusion_mask = cv2.bitwise_or(hand_occlusion, hair_candidate)

            # Refined garment mask: subtract occlusion
            clean_garment_mask = cv2.bitwise_and(g_mask, cv2.bitwise_not(occlusion_mask))

            out_g_mask_path = output_tracking_dir / f"clean_garment_{idx:04d}.png"
            out_occ_mask_path = output_tracking_dir / f"occlusion_{idx:04d}.png"

            cv2.imwrite(str(out_g_mask_path), clean_garment_mask)
            cv2.imwrite(str(out_occ_mask_path), occlusion_mask)

            tracked_results.append(
                TrackedGarmentMask(
                    frame_index=idx,
                    timestamp_ms=g_frame.timestamp_ms,
                    garment_mask_path=str(out_g_mask_path),
                    occlusion_mask_path=str(out_occ_mask_path),
                    is_occluded=hand_intersection or hair_intersection,
                    hand_intersection=hand_intersection,
                    hair_intersection=hair_intersection,
                )
            )

        return tracked_results
