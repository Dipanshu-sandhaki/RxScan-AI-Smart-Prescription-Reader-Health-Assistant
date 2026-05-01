import easyocr
import numpy as np
from PIL import Image
import logging

logger = logging.getLogger(__name__)

reader = None


def load_models():
    global reader
    try:
        reader = easyocr.Reader(['en'], gpu=False)
        logger.info("✅ EasyOCR loaded")
    except Exception as e:
        logger.error(f"OCR load failed: {e}")


def is_models_loaded():
    return reader is not None


def run_ocr(pil_image: Image.Image):
    try:
        img = np.array(pil_image)

        results = reader.readtext(img)

        if not results:
            return "", 0.0

        texts = []
        confidences = []

        for (_, text, conf) in results:
            if text.strip():
                texts.append(text)
                confidences.append(conf)

        final_text = " ".join(texts)
        avg_conf = sum(confidences) / len(confidences)

        return final_text.strip(), round(avg_conf, 3)

    except Exception as e:
        logger.error(f"OCR failed: {e}")
        return "", 0.0