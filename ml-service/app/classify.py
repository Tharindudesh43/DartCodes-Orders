"""
Loads the trained pipeline and exposes a single classify() function that
returns a category + confidence, with a threshold below which the
prediction is flagged as uncertain rather than forced onto the customer.
"""

import os
import joblib

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "classifier.joblib")

CONFIDENCE_THRESHOLD = 0.5

_pipeline = None


def _get_pipeline():
    global _pipeline
    if _pipeline is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"No trained model found at {MODEL_PATH}. Run `python app/train.py` first."
            )
        _pipeline = joblib.load(MODEL_PATH)
    return _pipeline


def classify(message: str) -> dict:
    if not message or not message.strip():
        return {
            "category": None,
            "confidence": 0.0,
            "isUncertain": True,
            "reason": "empty_message",
        }

    pipeline = _get_pipeline()

    probabilities = pipeline.predict_proba([message])[0]
    classes = pipeline.classes_

    best_idx = probabilities.argmax()
    best_category = classes[best_idx]
    best_confidence = float(probabilities[best_idx])

    is_uncertain = best_confidence < CONFIDENCE_THRESHOLD

    return {
        "category": None if is_uncertain else best_category,
        "confidence": round(best_confidence, 4),
        "isUncertain": is_uncertain,
        "topCandidate": best_category,
    }
