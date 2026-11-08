# Local Video Processing & Model Personalization Engine Setup Guide

This document outlines the setup, configuration, and verification of the 100% backend-owned Local Video Engine in **TrendMotion Studio**.

---

## 1. System Requirements & Dependencies

The pipeline operates strictly on local hardware with **zero external AI cloud dependencies**.

### Hardware Requirements
- **CPU**: Multi-core (4+ physical cores recommended).
- **RAM**: 16 GB system memory recommended.
- **GPU (Optional / Accelerated)**: NVIDIA CUDA GPU (e.g., GeForce GTX 1650 4GB VRAM or higher). Fallback to multi-threaded CPU mode is automatic.
- **Disk Space**: At least 10 GB free space for intermediate frame sequences, pose data, and rendered MP4 files.

### Required Software Binaries
- **Python**: 3.11+ (Tested on Python 3.13)
- **FFmpeg & FFprobe**: Version 5.0+ installed and available on system `PATH` (or configured via environment variables).

### Python Packages
```bash
pip install torch opencv-python onnxruntime rembg pillow numpy scipy
```

---

## 2. Directory Layout & Storage Structure

All media and models reside in the local filesystem root:

```
trendmotion-studio/
├── data/
│   ├── models/                    # Local model checkpoints & manifest
│   │   └── models_manifest.json   # Model registry and verification states
│   └── storage/                   # Local storage root
│       ├── templates/             # Ingested templates, frames, skeletons, pose sequences
│       │   └── {template_id}/
│       │       ├── analysis/      # metadata.json, scenes.json, pose_sequence.json, tracking.json
│       │       ├── frames/        # Extracted driving frames
│       │       ├── skeletons/     # Visualized skeleton overlay frames
│       │       └── masks/         # Garment slots and body masks
│       └── users/{user_id}/projects/{project_id}/personalizations/{generation_id}/
│           ├── base-video/        # personalized_base_video.mp4, thumbnail.jpg, contact_sheet.jpg
│           └── intermediate/      # raw_composed/, composited/, smoothed/
```

---

## 3. Configuration

Set the following variables in `.env` (or environment):

```env
# Storage
LOCAL_STORAGE_ROOT="./data/storage"

# Media Processing Binaries
FFMPEG_PATH="ffmpeg"
FFPROBE_PATH="ffprobe"

# AI Inference (Strictly local)
AI_IMAGE_PROVIDER="local"
AI_VIDEO_PROVIDER="local"
```

---

## 4. Verification & Testing

### Running Video Engine Automated Tests
From `apps/api`:
```bash
python -m pytest tests/test_video_engine.py -v
```

### Running Full Backend Test Suite
```bash
python -m pytest
```

### Quality Verification Metrics
The engine ensures:
1. **Pose Sequence**: 17 COCO keypoints tracked per frame with normalized coordinates $[0.0, 1.0]$.
2. **Person Tracking**: Stable tracking ID (`person_001`) with bounding boxes and occlusion detection.
3. **Motion Retargeting**: Joint angles preserved without limb distortion.
4. **Compositing**: Feathered alpha blending ($\text{radius}=7$) and luminance matching.
5. **Temporal Smoothing**: Exponential moving average ($\alpha=0.88$) removing inter-frame jitter.
6. **Final Rendering**: 9:16 portrait MP4 H.264 container with source audio pass-through and contact sheet.
