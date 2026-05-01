"""
RxScan AI — Image Preprocessor (FIXED v2)
OpenCV pipeline: Deskew → CLAHE → Denoise → Binarize → Line Segment

FIXES in v2:
- Horizontal kernel reduced (50→30) — was merging ALL lines into 1
- Added upscaling for small images (<1000px wide)
- CLAHE clipLimit increased (2.0→3.0) for faint ink
- Line merge gap threshold added for nearby rows
- Minimum line height filter tuned (10→15)
"""

import cv2
import numpy as np
from PIL import Image
from typing import List
import logging

logger = logging.getLogger(__name__)


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """
    Full OpenCV preprocessing pipeline for prescription images.
    Steps: decode → upscale → grayscale → CLAHE → denoise → binarize → morph
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise ValueError("Could not decode image. Use JPEG or PNG format.")

    h, w = img.shape[:2]

    # ✅ FIX 1: Upscale small images — TrOCR needs at least 1000px wide
    if w < 1000:
        scale = 1000 / w
        img = cv2.resize(img, None, fx=scale, fy=scale,
                         interpolation=cv2.INTER_CUBIC)
        logger.info(f"Upscaled image from {w}px to {int(w*scale)}px wide")

    # Resize if too large
    h, w = img.shape[:2]
    if max(h, w) > 2048:
        scale = 2048 / max(h, w)
        img = cv2.resize(img, (int(w * scale), int(h * scale)),
                         interpolation=cv2.INTER_AREA)

    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # ✅ FIX 2: Higher CLAHE clipLimit for faint handwritten ink
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)

    # Gaussian blur — removes camera/scan noise
    denoised = cv2.GaussianBlur(enhanced, (3, 3), 0)

    # Adaptive threshold — handles shadows and uneven lighting
    binary = cv2.adaptiveThreshold(
        denoised, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        blockSize=15, C=8
    )

    # Morphological close — reconnects broken letter strokes
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    cleaned = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)

    return cleaned


def deskew_image(image: np.ndarray) -> np.ndarray:
    """
    Deskew a slightly rotated image using Hough line transform.
    Fixes angled phone photos — single biggest accuracy driver.
    """
    try:
        edges = cv2.Canny(image, 50, 150, apertureSize=3)
        lines = cv2.HoughLines(edges, 1, np.pi / 180, threshold=100)
        if lines is None:
            return image

        angles = []
        for line in lines[:20]:
            rho, theta = line[0]
            angle = np.degrees(theta) - 90
            if -45 < angle < 45:
                angles.append(angle)

        if not angles:
            return image

        median_angle = np.median(angles)
        if abs(median_angle) < 0.5:
            return image

        h, w = image.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, median_angle, 1.0)
        deskewed = cv2.warpAffine(
            image, M, (w, h),
            flags=cv2.INTER_LINEAR,
            borderMode=cv2.BORDER_REPLICATE
        )
        logger.info(f"Deskewed by {median_angle:.1f} degrees")
        return deskewed

    except Exception as e:
        logger.warning(f"Deskew failed, using original: {e}")
        return image


def segment_text_lines(processed_img: np.ndarray) -> List[np.ndarray]:
    """
    Segment prescription into individual text line crops.
    CRITICAL: TrOCR needs LINE-LEVEL input, not full page.

    Returns list of line image crops (as numpy arrays).

    FIXED v2:
    - Kernel width reduced 50→30 (was merging all lines into 1 blob)
    - Added vertical gap merge to handle nearby lines properly
    - Minimum height increased to 15 to skip actual noise
    """
    # Invert for contour detection (text = white on black)
    inverted = cv2.bitwise_not(processed_img)

    # ✅ FIX 3: Smaller kernel — 50 was WAY too wide, merged all lines
    # Width 30 connects words within a line but keeps separate lines apart
    kernel_h = cv2.getStructuringElement(cv2.MORPH_RECT, (30, 3))
    dilated = cv2.dilate(inverted, kernel_h, iterations=2)

    # Find contours of text line blocks
    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL,
                                    cv2.CHAIN_APPROX_SIMPLE)

    if not contours:
        logger.warning("No contours found, returning full image as single line")
        return [processed_img]

    # Sort top → bottom
    bboxes = sorted(
        [cv2.boundingRect(c) for c in contours],
        key=lambda b: b[1]
    )

    # ✅ FIX 4: Merge bboxes that are vertically very close (same line)
    merged = []
    for x, y, w, h in bboxes:
        # Skip tiny noise blobs
        if h < 15 or w < 40:
            continue

        if merged:
            px, py, pw, ph = merged[-1]
            gap = y - (py + ph)
            # If gap < 12px, treat as same line (merge)
            if gap < 12:
                nx = min(px, x)
                ny = min(py, y)
                nw = max(px + pw, x + w) - nx
                nh = max(py + ph, y + h) - ny
                merged[-1] = (nx, ny, nw, nh)
                continue

        merged.append((x, y, w, h))

    if not merged:
        logger.warning("No valid lines after filtering, returning full image")
        return [processed_img]

    img_h, img_w = processed_img.shape[:2]
    lines = []

    for (x, y, w, h) in merged:
        pad = 8
        y1 = max(0, y - pad)
        y2 = min(img_h, y + h + pad)
        x1 = max(0, x - pad)
        x2 = min(img_w, x + w + pad)

        line_crop = processed_img[y1:y2, x1:x2]

        # Skip crops that are too thin (likely noise)
        if line_crop.shape[0] < 10 or line_crop.shape[1] < 30:
            continue

        lines.append(line_crop)

    if not lines:
        logger.warning("No valid lines after crop filtering, returning full image")
        return [processed_img]

    logger.info(f"Segmented into {len(lines)} text lines")
    return lines


def numpy_to_pil(img: np.ndarray) -> Image.Image:
    """Convert numpy array (grayscale or BGR) to PIL RGB Image."""
    if len(img.shape) == 2:
        return Image.fromarray(img).convert("RGB")
    else:
        return Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))