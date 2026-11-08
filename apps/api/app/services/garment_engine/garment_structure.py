import logging
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


@dataclass
class PocketAnchor:
    x1: int
    y1: int
    x2: int
    y2: int
    placement: str


@dataclass
class CollarAnchor:
    left_tip: tuple[int, int]
    right_tip: tuple[int, int]
    center_notch: tuple[int, int]


@dataclass
class FrameGarmentStructure:
    frame_index: int
    torso_center: tuple[int, int]
    placket_line: tuple[tuple[int, int], tuple[int, int]]  # ((x1, y1), (x2, y2))
    buttons: list[ButtonAnchor]
    pocket: PocketAnchor | None
    collar: CollarAnchor


class GarmentStructureService:
    """
    Computes spatial geometric anchors for garment details:
    collar tips, placket, exact button counts, left chest pocket, and cuff details.
    """

    def compute_structure(
        self,
        frame_shape: tuple[int, int],
        garment_bbox: list[int],
        button_count: int = 6,
        has_left_pocket: bool = True,
        frame_index: int = 0,
    ) -> FrameGarmentStructure:
        h, w = frame_shape[:2]
        bx, by, bw, bh = garment_bbox

        # Torso center & placket line (vertical center of garment)
        cx = bx + bw // 2
        top_y = by + int(bh * 0.08)
        bottom_y = by + int(bh * 0.95)

        placket_line = ((cx, top_y), (cx, bottom_y))

        # 1. Collar Anchors (Pointed collar spread)
        collar_left = (cx - int(bw * 0.16), top_y + int(bh * 0.06))
        collar_right = (cx + int(bw * 0.16), top_y + int(bh * 0.06))
        collar_center = (cx, top_y + int(bh * 0.02))
        collar = CollarAnchor(
            left_tip=collar_left,
            right_tip=collar_right,
            center_notch=collar_center,
        )

        # 2. Invariant Button Anchors (e.g. exactly 6 buttons along placket)
        buttons: list[ButtonAnchor] = []
        if button_count > 0:
            usable_height = bottom_y - top_y - int(bh * 0.12)
            spacing = usable_height / max(1, button_count - 1)
            btn_radius = max(2, int(bw * 0.015))

            for i in range(button_count):
                btn_y = int(top_y + int(bh * 0.08) + i * spacing)
                buttons.append(
                    ButtonAnchor(
                        index=i + 1,
                        x=cx,
                        y=btn_y,
                        radius=btn_radius,
                        color_bgr=(230, 230, 230),
                    )
                )

        # 3. Left Chest Pocket Anchor
        pocket = None
        if has_left_pocket:
            # Left chest of person is on the viewer's right when facing camera
            pocket_w = int(bw * 0.18)
            pocket_h = int(bh * 0.20)
            pocket_x1 = cx + int(bw * 0.08)
            pocket_y1 = top_y + int(bh * 0.18)
            pocket = PocketAnchor(
                x1=pocket_x1,
                y1=pocket_y1,
                x2=pocket_x1 + pocket_w,
                y2=pocket_y1 + pocket_h,
                placement="left_chest",
            )

        return FrameGarmentStructure(
            frame_index=frame_index,
            torso_center=(cx, (top_y + bottom_y) // 2),
            placket_line=placket_line,
            buttons=buttons,
            pocket=pocket,
            collar=collar,
        )
