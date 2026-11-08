import logging
import math
from dataclasses import dataclass
from typing import Any

import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class ButtonAnchor:
    index: int
    x: int
    y: int
    radius: int
    color_bgr: tuple[int, int, int]
    highlight_offset: tuple[int, int] = (-1, -1)
    shadow_offset: tuple[int, int] = (1, 1)


@dataclass
class PocketAnchor:
    x1: int
    y1: int
    x2: int
    y2: int
    placement: str
    hem_y: int


@dataclass
class CollarAnchor:
    left_tip: tuple[int, int]
    right_tip: tuple[int, int]
    center_notch: tuple[int, int]
    spread_angle: float


@dataclass
class FrameGarmentStructure:
    frame_index: int
    torso_center: tuple[int, int]
    placket_line: tuple[tuple[int, int], tuple[int, int]]  # ((x1, y1), (x2, y2))
    buttons: list[ButtonAnchor]
    pocket: PocketAnchor | None
    collar: CollarAnchor
    orientation: str = "front"
    tilt_degrees: float = 0.0


class GarmentStructureService:
    """
    Computes spatial geometric anchors for garment details:
    collar tips, placket curvature, exact invariant button counts,
    left chest pocket, and cuff details with perspective warping.
    """

    def compute_structure(
        self,
        frame_shape: tuple[int, int],
        garment_bbox: list[int],
        button_count: int = 6,
        has_left_pocket: bool = True,
        frame_index: int = 0,
        orientation: str = "front",
        tilt_degrees: float = 0.0,
    ) -> FrameGarmentStructure:
        h, w = frame_shape[:2]
        bx, by, bw, bh = garment_bbox

        # Perspective offset based on body orientation
        # If turning right, placket shifts slightly right (viewers right); if left, shifts left
        persp_offset = 0
        if "right" in orientation.lower():
            persp_offset = int(bw * 0.04)
        elif "left" in orientation.lower():
            persp_offset = -int(bw * 0.04)

        # Torso center & placket line
        cx = bx + bw // 2 + persp_offset
        top_y = by + int(bh * 0.08)
        bottom_y = by + int(bh * 0.95)

        # Placket tilt with torso angle
        tilt_rad = math.radians(min(25.0, max(-25.0, tilt_degrees)))
        top_x = int(cx - (bh * 0.45) * math.tan(tilt_rad))
        bot_x = int(cx + (bh * 0.45) * math.tan(tilt_rad))

        placket_line = ((top_x, top_y), (bot_x, bottom_y))

        # 1. Collar Anchors (Pointed collar spread)
        collar_spread_w = int(bw * 0.16)
        collar_drop = int(bh * 0.065)
        collar_left = (top_x - collar_spread_w, top_y + collar_drop)
        collar_right = (top_x + collar_spread_w, top_y + collar_drop)
        collar_center = (top_x, top_y + int(bh * 0.02))
        collar = CollarAnchor(
            left_tip=collar_left,
            right_tip=collar_right,
            center_notch=collar_center,
            spread_angle=55.0,
        )

        # 2. Invariant Button Anchors (e.g. exactly 6 buttons along placket)
        buttons: list[ButtonAnchor] = []
        if button_count > 0:
            usable_height = bottom_y - top_y - int(bh * 0.12)
            spacing = usable_height / max(1, button_count - 1)
            btn_radius = max(3, int(bw * 0.015))

            for i in range(button_count):
                frac = i / max(1, button_count - 1)
                curr_x = int(top_x + (bot_x - top_x) * frac)
                btn_y = int(top_y + int(bh * 0.08) + i * spacing)
                buttons.append(
                    ButtonAnchor(
                        index=i + 1,
                        x=curr_x,
                        y=btn_y,
                        radius=btn_radius,
                        color_bgr=(238, 238, 238),
                        highlight_offset=(-1, -1),
                        shadow_offset=(1, 1),
                    )
                )

        # 3. Left Chest Pocket Anchor
        pocket = None
        if has_left_pocket:
            # Person's left chest is to the right of placket for camera facing viewer
            pocket_w = int(bw * 0.18)
            pocket_h = int(bh * 0.20)
            pocket_x1 = cx + int(bw * 0.07)
            pocket_y1 = top_y + int(bh * 0.18)
            pocket = PocketAnchor(
                x1=pocket_x1,
                y1=pocket_y1,
                x2=pocket_x1 + pocket_w,
                y2=pocket_y1 + pocket_h,
                placement="left_chest",
                hem_y=pocket_y1 + max(4, int(pocket_h * 0.12)),
            )

        return FrameGarmentStructure(
            frame_index=frame_index,
            torso_center=(cx, (top_y + bottom_y) // 2),
            placket_line=placket_line,
            buttons=buttons,
            pocket=pocket,
            collar=collar,
            orientation=orientation,
            tilt_degrees=tilt_degrees,
        )
