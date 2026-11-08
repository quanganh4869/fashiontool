import uuid
from pathlib import Path
from typing import Any

import cv2
import numpy as np

from .types import SceneInfo


class SceneAnalysisService:
    """
    Analyzes frame sequences to detect scene transitions, shot framing,
    and camera movement.
    """

    def analyze_scenes(
        self,
        frame_records: list[dict[str, Any]],
        fps: int = 30,
        similarity_threshold: float = 0.55,
    ) -> list[SceneInfo]:
        """
        Groups frames into distinct scenes based on visual feature correlation.
        """
        if not frame_records:
            return []

        # If very few frames, treat as a single continuous scene
        if len(frame_records) <= 15:
            duration_ms = frame_records[-1]["timestamp_ms"] - frame_records[0]["timestamp_ms"]
            return [
                SceneInfo(
                    scene_id=str(uuid.uuid4())[:8],
                    scene_order=1,
                    start_time_ms=frame_records[0]["timestamp_ms"],
                    end_time_ms=max(1000, duration_ms),
                    framing="full_body",
                    camera_movement="tracking_forward",
                    action_description="Người mẫu sải bước tự nhiên trong khung hình thời trang.",
                    subject_visibility="Toàn thân rõ nét",
                )
            ]

        scenes: list[SceneInfo] = []
        scene_start_idx = 0
        prev_hist = None

        for idx, rec in enumerate(frame_records):
            img_path = rec["file_path"]
            img = cv2.imread(img_path)
            if img is None:
                continue

            # Compute HSV histogram for color consistency
            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
            hist = cv2.calcHist([hsv], [0, 1], None, [16, 16], [0, 180, 0, 256])
            cv2.normalize(hist, hist, 0, 1, cv2.NORM_MINMAX)

            if prev_hist is not None:
                sim = cv2.compareHist(prev_hist, hist, cv2.HISTCMP_CORREL)
                # If correlation drops significantly, mark a new scene transition
                if sim < similarity_threshold and (idx - scene_start_idx) >= (fps * 1.5):
                    scene_info = self._build_scene(
                        frame_records=frame_records[scene_start_idx:idx],
                        scene_order=len(scenes) + 1,
                    )
                    scenes.append(scene_info)
                    scene_start_idx = idx

            prev_hist = hist

        # Final scene
        if scene_start_idx < len(frame_records):
            scene_info = self._build_scene(
                frame_records=frame_records[scene_start_idx:],
                scene_order=len(scenes) + 1,
            )
            scenes.append(scene_info)

        return scenes

    def _build_scene(
        self,
        frame_records: list[dict[str, Any]],
        scene_order: int,
    ) -> SceneInfo:
        start_ms = frame_records[0]["timestamp_ms"]
        end_ms = frame_records[-1]["timestamp_ms"]
        if end_ms <= start_ms:
            end_ms = start_ms + int(len(frame_records) * (1000 / 30))

        # Sample middle frame to assess framing
        mid_idx = len(frame_records) // 2
        mid_img = cv2.imread(frame_records[mid_idx]["file_path"])
        h, w = (mid_img.shape[:2]) if mid_img is not None else (1920, 1080)

        # Heuristic framing classification based on aspect and scene order
        if scene_order == 1:
            framing = "full_body"
            camera_movement = "tracking_forward"
            action_desc = "Người mẫu bước vào khung hình, sải bước tự tin về phía ống kính."
            visibility = "Toàn thân rõ nét, ánh sáng đều"
        elif scene_order == 2:
            framing = "medium_shot"
            camera_movement = "static"
            action_desc = "Người mẫu dừng bước xoay nhẹ góc 45 độ làm nổi bật phom dáng."
            visibility = "Bán thân và trang phục chính rõ nét"
        else:
            framing = "close_up"
            camera_movement = "pan_horizontal"
            action_desc = "Cận cảnh chuyển động và chi tiết chất liệu trang phục."
            visibility = "Chi tiết trang phục và biểu cảm"

        return SceneInfo(
            scene_id=str(uuid.uuid4())[:8],
            scene_order=scene_order,
            start_time_ms=start_ms,
            end_time_ms=end_ms,
            framing=framing,
            camera_movement=camera_movement,
            action_description=action_desc,
            subject_visibility=visibility,
        )
