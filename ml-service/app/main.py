"""
Endpoints:
  GET  /health -> liveness check
  POST /classify -> { message } -> { category, confidence, isUncertain }
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from app.classify import classify

app = FastAPI(title="DartCodes Message Classifier", version="1.0.0")

class ClassifyRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)


class ClassifyResponse(BaseModel):
    category: str | None
    confidence: float
    isUncertain: bool
    topCandidate: str | None = None

#check health
@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/classify", response_model=ClassifyResponse)
def classify_message(payload: ClassifyRequest):
    try:
        result = classify(payload.message)
        return result
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Classification failed: {e}")