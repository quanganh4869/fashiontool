import json
import logging
import subprocess
from pathlib import Path
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)


class FrameExtractionService:
    """
    Decodes video into individual frames preserving timestamps, order,
    and metadata using local FFmpeg and FFprobe.
    """

    def __init__(self, ffmpeg_bin: str | None = None, ffprobe_bin: str | None = None):
        self.ffmpeg_bin = ffmpeg_bin or settings.FFMPEG_PATH
        self.ffprobe_bin = ffprobe_bin or settings.FFPROBE_PATH

    def probe_video(self, video_path: Path) -> dict[str, Any]:
        """
        Extracts stream metadata, duration, resolution, and fps using FFprobe.
        """
        if not video_path.is_file():
            raise FileNotFoundError(f"Video file not found: {video_path}")

        cmd = [
            self.ffprobe_bin,
            "-v", "error",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            str(video_path),
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        data = json.loads(res.stdout)

        video_stream = next(
            (s for s in data.get("streams", []) if s.get("codec_type") == "video"),
            None,
        )
        if not video_stream:
            raise ValueError("No video stream found in media file.")

        width = int(video_stream.get("width", 1080))
        height = int(video_stream.get("height", 1920))

        # Calculate Aspect Ratio
        if width > 0 and height > 0:
            ratio_val = width / height
            if abs(ratio_val - 9 / 16) < 0.05:
                aspect_ratio = "9:16"
            elif abs(ratio_val - 16 / 9) < 0.05:
                aspect_ratio = "16:9"
            elif abs(ratio_val - 1.0) < 0.05:
                aspect_ratio = "1:1"
            else:
                aspect_ratio = f"{width}:{height}"
        else:
            aspect_ratio = "9:16"

        # Frame rate
        r_fps = video_stream.get("r_frame_rate", "30/1")
        try:
            num, den = map(int, r_fps.split("/"))
            fps = round(num / den) if den != 0 else 30
        except Exception:
            fps = 30

        duration_sec = float(
            video_stream.get("duration")
            or data.get("format", {}).get("duration")
            or 0.0
        )
        duration_ms = int(duration_sec * 1000)

        nb_frames = int(video_stream.get("nb_frames") or round(duration_sec * fps) or 30)

        has_audio = any(s.get("codec_type") == "audio" for s in data.get("streams", []))

        return {
            "width": width,
            "height": height,
            "aspect_ratio": aspect_ratio,
            "fps": fps,
            "duration_ms": duration_ms,
            "total_frames": nb_frames,
            "has_audio": has_audio,
            "video_codec": video_stream.get("codec_name", "h264"),
            "bitrate": int(data.get("format", {}).get("bit_rate") or 0),
        }

    def extract_frames(
        self,
        video_path: Path,
        output_dir: Path,
        max_fps: int = 30,
        max_frames: int | None = None,
    ) -> list[dict[str, Any]]:
        """
        Extracts video frames to disk with timestamps and metadata.
        """
        output_dir.mkdir(parents=True, exist_ok=True)
        probe = self.probe_video(video_path)
        fps = min(probe["fps"], max_fps)

        frame_pattern = output_dir / "frame_%04d.jpg"

        cmd = [
            self.ffmpeg_bin,
            "-y",
            "-i", str(video_path),
            "-vf", f"fps={fps}",
            "-q:v", "2",
        ]
        if max_frames:
            cmd.extend(["-vframes", str(max_frames)])
        cmd.append(str(frame_pattern))

        subprocess.run(cmd, capture_output=True, text=True, check=True)

        # Collect extracted frame files
        extracted_files = sorted(output_dir.glob("frame_*.jpg"))
        frame_records = []
        for idx, f in enumerate(extracted_files):
            timestamp_ms = int((idx / fps) * 1000)
            frame_records.append({
                "frame_index": idx,
                "timestamp_ms": timestamp_ms,
                "file_path": str(f),
                "filename": f.name,
            })

        return frame_records

    def extract_poster(self, video_path: Path, output_poster_path: Path, timestamp_sec: float = 0.5) -> Path:
        """
        Extracts a single representative frame as high quality poster.
        """
        output_poster_path.parent.mkdir(parents=True, exist_ok=True)
        cmd = [
            self.ffmpeg_bin,
            "-y",
            "-ss", str(timestamp_sec),
            "-i", str(video_path),
            "-vframes", "1",
            "-q:v", "2",
            str(output_poster_path),
        ]
        subprocess.run(cmd, capture_output=True, text=True, check=True)
        return output_poster_path
