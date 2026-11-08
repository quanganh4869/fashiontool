from pathlib import Path
from typing import Any

import cv2
import numpy as np


class ModelIdentityService:
    """
    Extracts facial identity, skin tone, and visual conditioning features
    from the user's real Model Profile reference photos.
    """

    def extract_identity(self, reference_photo_paths: list[Path]) -> dict[str, Any]:
        if not reference_photo_paths:
            raise ValueError("No model reference photos provided.")

        primary_photo = reference_photo_paths[0]
        img = cv2.imread(str(primary_photo))
        if img is None:
            raise ValueError(f"Failed to load reference image: {primary_photo}")

        h, w = img.shape[:2]

        # Detect face / head region using Cascade or upper-third heuristic
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(60, 60))

        if len(faces) > 0:
            fx, fy, fw, fh = faces[0]
            # Expand to include hair and neck
            pad_x = int(fw * 0.2)
            pad_y = int(fh * 0.3)
            fx1 = max(0, fx - pad_x)
            fy1 = max(0, fy - pad_y)
            fx2 = min(w, fx + fw + pad_x)
            fy2 = min(h, fy + fh + int(pad_y * 1.5))
            face_crop = img[fy1:fy2, fx1:fx2]
            face_bbox = [fx1, fy1, fx2 - fx1, fy2 - fy1]
        else:
            # Fallback to upper 35% of portrait photo
            face_crop = img[: int(h * 0.35), int(w * 0.2) : int(w * 0.8)]
            face_bbox = [int(w * 0.2), 0, int(w * 0.6), int(h * 0.35)]

        # Extract dominant color and skin tone signature
        hsv_face = cv2.cvtColor(face_crop, cv2.COLOR_BGR2HSV)
        avg_hue = float(np.median(hsv_face[:, :, 0]))
        avg_sat = float(np.median(hsv_face[:, :, 1]))
        avg_val = float(np.median(hsv_face[:, :, 2]))

        return {
            "primary_photo_path": str(primary_photo),
            "face_crop": face_crop,
            "face_bbox": face_bbox,
            "skin_signature": {"h": avg_hue, "s": avg_sat, "v": avg_val},
            "reference_aspect": round(w / h, 3),
            "photo_count": len(reference_photo_paths),
        }
