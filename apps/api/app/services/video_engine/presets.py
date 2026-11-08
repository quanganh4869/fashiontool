"""
Video Generation Presets and Quality Configurations.
Provides standardized profiles for Preview, Standard, and High Quality generation.
"""

from dataclasses import dataclass
from enum import Enum
from typing import Any


class QualityPresetName(str, Enum):
    PREVIEW = "preview"
    STANDARD = "standard"
    HIGH_QUALITY = "high_quality"


@dataclass(frozen=True)
class QualityPresetConfig:
    name: QualityPresetName
    display_name: str
    description: str
    target_width: int
    target_height: int
    fps: int
    crf: int
    ffmpeg_preset: str
    temporal_alpha: float
    subpixel_cloth_texture: bool
    multi_scale_occlusion: bool
    qc_strictness: str  # lenient, standard, strict
    max_frames_preview: int | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "preset_name": self.name.value,
            "display_name": self.display_name,
            "target_width": self.target_width,
            "target_height": self.target_height,
            "fps": self.fps,
            "crf": self.crf,
            "ffmpeg_preset": self.ffmpeg_preset,
            "temporal_alpha": self.temporal_alpha,
            "subpixel_cloth_texture": self.subpixel_cloth_texture,
            "multi_scale_occlusion": self.multi_scale_occlusion,
            "qc_strictness": self.qc_strictness,
        }


PRESET_PREVIEW = QualityPresetConfig(
    name=QualityPresetName.PREVIEW,
    display_name="Xem trước (Preview)",
    description="Kiểm tra chuyển động và vị trí trang phục nhanh với độ phân giải 540x960 15 FPS.",
    target_width=540,
    target_height=960,
    fps=15,
    crf=26,
    ffmpeg_preset="veryfast",
    temporal_alpha=0.82,
    subpixel_cloth_texture=False,
    multi_scale_occlusion=False,
    qc_strictness="lenient",
    max_frames_preview=45,
)

PRESET_STANDARD = QualityPresetConfig(
    name=QualityPresetName.STANDARD,
    display_name="Chuẩn thương mại (Standard)",
    description="Chất lượng cân bằng tối ưu cho TikTok/Reels với 1080x1920 24 FPS, CRF 22.",
    target_width=1080,
    target_height=1920,
    fps=24,
    crf=22,
    ffmpeg_preset="fast",
    temporal_alpha=0.88,
    subpixel_cloth_texture=True,
    multi_scale_occlusion=True,
    qc_strictness="standard",
)

PRESET_HIGH_QUALITY = QualityPresetConfig(
    name=QualityPresetName.HIGH_QUALITY,
    display_name="Chất lượng cao nhất (High Quality)",
    description="Độ nét cao tối đa 1080x1920 30 FPS, CRF 18, tái tạo hạt vải vi mô và chống rung đa tầng.",
    target_width=1080,
    target_height=1920,
    fps=30,
    crf=18,
    ffmpeg_preset="medium",
    temporal_alpha=0.92,
    subpixel_cloth_texture=True,
    multi_scale_occlusion=True,
    qc_strictness="strict",
)

PRESETS_REGISTRY: dict[str, QualityPresetConfig] = {
    QualityPresetName.PREVIEW.value: PRESET_PREVIEW,
    QualityPresetName.STANDARD.value: PRESET_STANDARD,
    QualityPresetName.HIGH_QUALITY.value: PRESET_HIGH_QUALITY,
}


def get_preset_config(preset_name: str | None = None) -> QualityPresetConfig:
    if not preset_name:
        return PRESET_STANDARD
    clean = preset_name.lower().strip()
    return PRESETS_REGISTRY.get(clean, PRESET_STANDARD)
