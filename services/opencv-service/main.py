from fastapi import FastAPI
from pydantic import BaseModel
import cv2
import numpy as np
import base64
import os
from pdf2image import convert_from_bytes

app = FastAPI()

MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "10"))


class ScanRequest(BaseModel):
    file_base64: str
    mime_type: str


class ScanResult(BaseModel):
    safe: bool
    score: float
    findings: list[str]


@app.get("/health")
async def health():
    return {"ok": True}


@app.post("/scan-images", response_model=ScanResult)
async def scan_images(request: ScanRequest):
    file_bytes = base64.b64decode(request.file_base64)
    max_bytes = MAX_FILE_SIZE_MB * 1024 * 1024
    if len(file_bytes) > max_bytes:
        return ScanResult(
            safe=False,
            score=1.0,
            findings=["File exceeds OpenCV scan size limit"],
        )

    findings: list[str] = []

    if request.mime_type == "application/pdf":
        try:
            pages = convert_from_bytes(file_bytes, dpi=72, fmt="jpeg")
        except Exception:
            return ScanResult(
                safe=True, score=0.0, findings=["Could not render PDF pages"]
            )

        for i, page in enumerate(pages[:5]):
            img_array = np.array(page.convert("RGB"))
            findings.extend(analyze_image(img_array, page_num=i + 1))

    score = min(len(findings) * 0.2, 1.0)
    return ScanResult(safe=score < 0.8, score=score, findings=findings)


def analyze_image(img: np.ndarray, page_num: int) -> list[str]:
    findings: list[str] = []

    lsb_entropy = calculate_lsb_entropy(img)
    if lsb_entropy > 7.5:
        findings.append(
            f"Page {page_num}: Unusual LSB entropy ({lsb_entropy:.2f}) — possible steganography"
        )

    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    very_dark = np.sum(gray < 5)
    total = gray.size
    if total > 0 and very_dark / total > 0.95:
        findings.append(
            f"Page {page_num}: Page is nearly all-black — possible hidden content"
        )

    return findings


def calculate_lsb_entropy(img: np.ndarray) -> float:
    lsbs = img & 1
    flat = lsbs.flatten()
    _, counts = np.unique(flat, return_counts=True)
    probs = counts / len(flat)
    entropy = -np.sum(probs * np.log2(probs + 1e-10))
    return float(entropy)
