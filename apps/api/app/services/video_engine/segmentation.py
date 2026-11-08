import uuid
from pathlib import Path
from typing import Any

import cv2
import numpy as np

from .types import GarmentSlotAnalysis, PoseFrame


class SegmentationService:
    """
    Generates human body segmentation masks and identifies garment slot regions
    from detected pose structures.
    """

    def segment_frames(
        self,
        frame_records: list[dict[str, Any]],
        pose_sequence: list[PoseFrame],
        output_masks_dir: Path | None = None,
    ) -> list[GarmentSlotAnalysis]:
        if output_masks_dir:
            output_masks_dir.mkdir(parents=True, exist_ok=True)

        garment_slots: list[GarmentSlotAnalysis] = []

        for idx, rec in enumerate(frame_records):
            img_path = rec["file_path"]
            img = cv2.imread(img_path)
            if img is None:
                continue

            h, w = img.shape[:2]
            pose = pose_sequence[idx] if idx < len(pose_sequence) else None

            # Generate binary person mask using pose landmarks & contour hull
            mask = np.zeros((h, w), dtype=np.uint8)

            if pose:
                pts = []
                for kp in pose.keypoints.values():
                    if kp.confidence > 0.5:
                        pts.append([int(kp.x * w), int(kp.y * h)])

                if len(pts) >= 5:
                    hull = cv2.convexHull(np.array(pts, dtype=np.int32))
                    cv2.fillConvexPoly(mask, hull, 255)
                    # Dilate to cover clothing edges comfortably
                    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (35, 35))
                    mask = cv2.dilate(mask, kernel, iterations=2)
                else:
                    cv2.rectangle(mask, (int(w * 0.25), int(h * 0.15)), (int(w * 0.75), int(h * 0.85)), 255, -1)
            else:
                cv2.rectangle(mask, (int(w * 0.25), int(h * 0.15)), (int(w * 0.75), int(h * 0.85)), 255, -1)

            if output_masks_dir:
                mask_path = output_masks_dir / f"mask_{idx:04d}.png"
                cv2.imwrite(str(mask_path), mask)

        # Identify Garment Slots from average pose landmarks
        if pose_sequence:
            mid_pose = pose_sequence[len(pose_sequence) // 2]
            kps = mid_pose.keypoints

            l_sh = kps.get("left_shoulder")
            r_sh = kps.get("right_shoulder")
            l_hip = kps.get("left_hip")
            r_hip = kps.get("right_hip")
            l_ank = kps.get("left_ankle")
            r_ank = kps.get("right_ankle")

            if l_sh and r_sh and l_hip and r_hip:
                # Upper body slot (áo)
                sh_top = min(l_sh.y, r_sh.y)
                hip_bot = max(l_hip.y, r_hip.y)
                sh_l = min(l_sh.x, r_sh.x) - 0.08
                sh_r = max(l_sh.x, r_sh.x) + 0.08

                garment_slots.append(
                    GarmentSlotAnalysis(
                        slot_id=f"slot-{uuid.uuid4().hex[:6]}",
                        slot_type="upper_body",
                        slot_name="Áo thân trên (Sơ mi / Áo thun / Top)",
                        bbox=[int(sh_l * 1080), int(sh_top * 1920), int((sh_r - sh_l) * 1080), int((hip_bot - sh_top) * 1920)],
                        confidence=0.96,
                        assessment_status="SUPPORTED",
                    )
                )

                # Lower body slot (quần / chân váy)
                if l_ank and r_ank:
                    ank_bot = max(l_ank.y, r_ank.y)
                    garment_slots.append(
                        GarmentSlotAnalysis(
                            slot_id=f"slot-{uuid.uuid4().hex[:6]}",
                            slot_type="lower_body",
                            slot_name="Quần / Chân váy (Pants / Skirt)",
                            bbox=[int((sh_l + 0.02) * 1080), int(hip_bot * 1920), int((sh_r - sh_l - 0.04) * 1080), int((ank_bot - hip_bot) * 1920)],
                            confidence=0.94,
                            assessment_status="SUPPORTED",
                        )
                    )

                # Full dress slot
                garment_slots.append(
                    GarmentSlotAnalysis(
                        slot_id=f"slot-{uuid.uuid4().hex[:6]}",
                        slot_type="dress_full_body",
                        slot_name="Đầm liền / Jumpsuit toàn thân",
                        bbox=[int(sh_l * 1080), int(sh_top * 1920), int((sh_r - sh_l) * 1080), int(((l_ank.y if l_ank else 0.95) - sh_top) * 1920)],
                        confidence=0.92,
                        assessment_status="SUPPORTED",
                    )
                )

        return garment_slots
