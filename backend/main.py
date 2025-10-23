"""FastAPI backend for ECM Extractor - Workshop version."""

from __future__ import annotations
import os
import sys
from pathlib import Path
from typing import List, Dict, Any
import traceback

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv

from ecm_extraction.pdf_parser import extract_markdown_with_images
from ecm_extraction.extractor import extract_ecms_from_markdown
from ecm_extraction.llm_client import CBorgLLMClient

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="ECM Extractor API",
    description="Extract Energy Conservation Measures from building audit reports",
    version="0.1.0",
)

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5175"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Upload directory
UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Mount static files for serving uploaded images and markdown
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


# Request/Response models
class ExtractECMRequest(BaseModel):
    """Request model for ECM extraction."""
    markdown: str


class MarkdownExtractionResponse(BaseModel):
    """Response model for markdown extraction."""
    markdown: str
    images: List[Dict[str, Any]]
    output_dir: str


class ECMExtractionResponse(BaseModel):
    """Response model for ECM extraction."""
    records: List[Dict[str, Any]]
    record_count: int


@app.get("/")
async def root():
    """Root endpoint - API health check."""
    return {
        "message": "ECM Extractor API",
        "version": "0.1.0",
        "status": "running",
    }


@app.post("/api/extract-markdown", response_model=MarkdownExtractionResponse)
async def extract_markdown_endpoint(file: UploadFile = File(...)):
    """Extract markdown and images from uploaded PDF.

    Args:
        file: Uploaded PDF file

    Returns:
        Markdown text, image metadata with URLs, and output directory path

    Raises:
        HTTPException: If file processing fails
    """
    # Validate file type
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported"
        )

    # Save uploaded file temporarily
    temp_path = UPLOAD_DIR / file.filename
    try:
        # Write file to disk
        with open(temp_path, "wb") as f:
            content = await file.read()
            f.write(content)

        # Extract markdown and images, saving to organized folder
        # This creates: uploads/{pdf_name}/document.md and uploads/{pdf_name}/images/*.png
        result = extract_markdown_with_images(
            pdf_path=temp_path,
            output_dir=None,  # Auto-generate based on PDF filename
            base_url="http://localhost:8000"
        )

        return MarkdownExtractionResponse(
            markdown=result.markdown,
            images=result.images,
            output_dir=result.output_dir,
        )

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to extract markdown from PDF: {str(e)}"
        ) from e

    finally:
        # Clean up temporary PDF file (but keep the extracted folder)
        if temp_path.exists():
            temp_path.unlink()


@app.post("/api/extract-ecm", response_model=ECMExtractionResponse)
async def extract_ecm_endpoint(request: ExtractECMRequest):
    """Extract ECM records from markdown using LLM.

    Args:
        request: Request containing markdown text

    Returns:
        List of extracted ECM records

    Raises:
        HTTPException: If extraction fails
    """
    if not request.markdown or not request.markdown.strip():
        raise HTTPException(
            status_code=400,
            detail="Markdown content is required"
        )

    try:
        # Initialize LLM client
        llm_client = CBorgLLMClient()

        # Extract ECMs
        records = extract_ecms_from_markdown(
            markdown=request.markdown,
            client=llm_client,
        )

        # Convert to dictionaries
        record_dicts = [record.model_dump() for record in records]

        return ECMExtractionResponse(
            records=record_dicts,
            record_count=len(record_dicts),
        )

    except ValueError as e:
        # API key or configuration error
        raise HTTPException(
            status_code=500,
            detail=f"Configuration error: {str(e)}"
        ) from e

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to extract ECM data: {str(e)}"
        ) from e


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    # Check if API key is configured
    api_key = os.environ.get("CBORG_API_KEY")
    has_api_key = bool(api_key)

    return {
        "status": "healthy",
        "api_key_configured": has_api_key,
        "upload_dir_exists": UPLOAD_DIR.exists(),
    }


if __name__ == "__main__":
    import uvicorn

    # Run with: python backend/main.py
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Auto-reload on code changes
    )
