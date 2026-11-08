import subprocess
from pathlib import Path

from app.core.config import settings


class VideoRenderingService:
    """
    Renders the final video sequence from processed frames using local FFmpeg,
    preserving source audio and verifying media compliance.
    """

    def __init__(self, ffmpeg_bin: str | None = None, ffprobe_bin: str | None = None):
        self.ffmpeg_bin = ffmpeg_bin or settings.FFMPEG_PATH
        self.ffprobe_bin = ffprobe_bin or settings.FFPROBE_PATH

    def render_video_from_frames(
        self,
        frames_dir: Path,
        output_video_path: Path,
        fps: int = 30,
        source_audio_video_path: Path | None = None,
        width: int = 1080,
        height: int = 1920,
    ) -> Path:
        output_video_path.parent.mkdir(parents=True, exist_ok=True)
        frame_pattern = frames_dir / "frame_%04d.jpg"

        cmd = [
            self.ffmpeg_bin,
            "-y",
            "-framerate", str(fps),
            "-i", str(frame_pattern),
        ]

        # Preserve audio from source template if present
        if source_audio_video_path and source_audio_video_path.is_file():
            cmd.extend([
                "-i", str(source_audio_video_path),
                "-map", "0:v:0",
                "-map", "1:a:0?",
                "-c:a", "aac",
                "-b:a", "128k",
            ])
        else:
            cmd.extend([
                "-map", "0:v:0",
            ])

        cmd.extend([
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-preset", "fast",
            "-crf", "22",
            "-shortest",
            str(output_video_path),
        ])

        subprocess.run(cmd, capture_output=True, text=True, check=True)

        # Validate with ffprobe
        self.validate_output(output_video_path)
        return output_video_path

    def validate_output(self, video_path: Path) -> bool:
        if not video_path.is_file() or video_path.stat().st_size == 0:
            raise ValueError(f"Output video rendering produced empty or missing file: {video_path}")

        cmd = [
            self.ffprobe_bin,
            "-v", "error",
            "-show_entries", "format=duration,size",
            "-of", "default=noprint_wrappers=1",
            str(video_path),
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        if "duration=" not in res.stdout:
            raise ValueError("Rendered output file failed media validation.")
        return True
