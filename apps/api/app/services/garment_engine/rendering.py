import hashlib
import logging
import subprocess
from pathlib import Path

import cv2
import numpy as np

from app.core.config import settings

logger = logging.getLogger(__name__)


class FinalVideoRenderingService:
    """
    Renders Final Product Video MP4, creates 8-frame Contact Sheet,
    and produces side-by-side comparison video using local FFmpeg and OpenCV.
    """

    def __init__(self, ffmpeg_bin: str | None = None, ffprobe_bin: str | None = None):
        self.ffmpeg_bin = ffmpeg_bin or settings.FFMPEG_PATH
        self.ffprobe_bin = ffprobe_bin or settings.FFPROBE_PATH

    def render_final_video(
        self,
        frames_dir: Path,
        output_video_path: Path,
        fps: int = 30,
        source_audio_path: Path | None = None,
        crf: int = 22,
    ) -> Path:
        output_video_path.parent.mkdir(parents=True, exist_ok=True)
        frame_pattern = frames_dir / "frame_%04d.jpg"

        cmd = [
            self.ffmpeg_bin,
            "-y",
            "-framerate", str(fps),
            "-i", str(frame_pattern),
        ]

        # Preserve audio
        if source_audio_path and source_audio_path.is_file():
            cmd.extend([
                "-i", str(source_audio_path),
                "-map", "0:v:0",
                "-map", "1:a:0?",
                "-c:a", "aac",
                "-b:a", "128k",
            ])
        else:
            cmd.extend(["-map", "0:v:0"])

        cmd.extend([
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-preset", "fast",
            "-crf", str(crf),
            "-shortest",
            str(output_video_path),
        ])

        subprocess.run(cmd, capture_output=True, text=True, check=True)
        return output_video_path

    def generate_contact_sheet(
        self,
        video_path: Path,
        output_image_path: Path,
        num_rows: int = 2,
        num_cols: int = 4,
    ) -> Path:
        """
        Samples representative frames across the video and tiles them into a contact sheet.
        """
        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            raise ValueError(f"Cannot open video for contact sheet: {video_path}")

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0

        num_samples = num_rows * num_cols
        step = max(1, total_frames // num_samples)
        sample_indices = [min(total_frames - 1, i * step) for i in range(num_samples)]

        thumbnails: list[np.ndarray] = []
        thumb_w, thumb_h = 270, 480

        for s_idx in sample_indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, s_idx)
            ret, frame = cap.read()
            if not ret or frame is None:
                thumb = np.zeros((thumb_h, thumb_w, 3), dtype=np.uint8)
            else:
                thumb = cv2.resize(frame, (thumb_w, thumb_h), interpolation=cv2.INTER_AREA)

            # Draw timestamp badge
            timestamp_sec = s_idx / fps
            badge_text = f"{timestamp_sec:.2f}s (f#{s_idx})"
            cv2.rectangle(thumb, (5, thumb_h - 25), (130, thumb_h - 5), (0, 0, 0), -1)
            cv2.putText(thumb, badge_text, (8, thumb_h - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (255, 255, 255), 1)

            thumbnails.append(thumb)

        cap.release()

        # Build grid
        grid_rows: list[np.ndarray] = []
        for r in range(num_rows):
            row_thumbs = thumbnails[r * num_cols : (r + 1) * num_cols]
            grid_rows.append(np.hstack(row_thumbs))

        contact_sheet = np.vstack(grid_rows)
        output_image_path.parent.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(str(output_image_path), contact_sheet, [cv2.IMWRITE_JPEG_QUALITY, 90])
        return output_image_path

    def generate_side_by_side_comparison(
        self,
        base_video_path: Path,
        final_video_path: Path,
        output_comparison_path: Path,
    ) -> Path:
        """
        Creates a side-by-side video comparing Base Video (left) with Final Product Video (right).
        """
        output_comparison_path.parent.mkdir(parents=True, exist_ok=True)

        cmd = [
            self.ffmpeg_bin,
            "-y",
            "-i", str(base_video_path),
            "-i", str(final_video_path),
            "-filter_complex",
            "[0:v]pad=iw*2:ih[int];[int][1:v]overlay=W/2:0[v]",
            "-map", "[v]",
            "-map", "1:a:0?",
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "24",
            "-shortest",
            str(output_comparison_path),
        ]
        try:
            subprocess.run(cmd, capture_output=True, text=True, check=True)
        except Exception as e:
            logger.warning("Side-by-side comparison video rendering skipped: %s", e)

        return output_comparison_path

    def get_file_sha256(self, file_path: Path) -> str:
        hasher = hashlib.sha256()
        with open(file_path, "rb") as f:
            while chunk := f.read(65536):
                hasher.update(chunk)
        return hasher.hexdigest()
