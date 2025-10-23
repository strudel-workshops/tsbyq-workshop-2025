"""FastAPI backend for ECM Extractor - Workshop version."""

from __future__ import annotations
import os
import sys
import json
import shutil
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime
import traceback

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv

from ecm_extraction.pdf_parser import extract_markdown_with_images
from ecm_extraction.extractor import extract_ecms_from_markdown
from config import create_llm_client, get_llm_provider, get_config

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
    pdf_id: Optional[str] = None


class MarkdownExtractionResponse(BaseModel):
    """Response model for markdown extraction."""
    markdown: str
    images: List[Dict[str, Any]]
    output_dir: str
    pdf_id: str


class ECMExtractionResponse(BaseModel):
    """Response model for ECM extraction."""
    records: List[Dict[str, Any]]
    record_count: int


class ChatRequest(BaseModel):
    """Request model for chat completion."""
    messages: List[Dict[str, str]]
    ecm_data: List[Dict[str, Any]]
    temperature: float = 0.7
    max_tokens: int = 500


class ChatResponse(BaseModel):
    """Response model for chat completion."""
    message: str


class PdfMetadata(BaseModel):
    """Metadata for an uploaded PDF."""
    id: str
    filename: str
    upload_date: str
    image_count: int
    file_size: int
    has_ecm_data: bool
    ecm_count: Optional[int] = None


class PdfListResponse(BaseModel):
    """Response model for PDF list."""
    pdfs: List[PdfMetadata]


class PdfDetailResponse(BaseModel):
    """Response model for PDF details."""
    id: str
    filename: str
    markdown: str
    images: List[Dict[str, Any]]
    ecm_results: Optional[List[Dict[str, Any]]] = None
    upload_date: str


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

        # Create metadata file
        output_dir = Path(result.output_dir)
        pdf_id = output_dir.name
        metadata = {
            "id": pdf_id,
            "filename": file.filename,
            "upload_date": datetime.now().isoformat(),
            "image_count": len(result.images),
            "file_size": len(content),  # Size in bytes
            "has_ecm_data": False,
            "ecm_count": None,  # Will be set after ECM extraction
        }
        metadata_path = output_dir / "metadata.json"
        metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

        return MarkdownExtractionResponse(
            markdown=result.markdown,
            images=result.images,
            output_dir=result.output_dir,
            pdf_id=pdf_id,
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
        request: Request containing markdown text and optional pdf_id

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
        llm_client = create_llm_client("extraction")

        # Extract ECMs
        records = extract_ecms_from_markdown(
            markdown=request.markdown,
            client=llm_client,
        )

        # Convert to flat dictionaries for frontend compatibility
        # The frontend expects a flat structure with fields like ecm_name, building_name, etc.
        record_dicts = [record.to_flat_dict() for record in records]

        # Save ECM results if pdf_id is provided
        if request.pdf_id:
            pdf_dir = UPLOAD_DIR / request.pdf_id
            if pdf_dir.exists():
                # Save ECM results
                ecm_results_path = pdf_dir / "ecm_results.json"
                ecm_results_path.write_text(
                    json.dumps(record_dicts, indent=2), 
                    encoding="utf-8"
                )
                
                # Update metadata
                metadata_path = pdf_dir / "metadata.json"
                if metadata_path.exists():
                    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
                    metadata["has_ecm_data"] = True
                    metadata["ecm_count"] = len(record_dicts)
                    metadata["ecm_extraction_date"] = datetime.now().isoformat()
                    metadata_path.write_text(
                        json.dumps(metadata, indent=2), 
                        encoding="utf-8"
                    )

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


@app.get("/api/pdfs", response_model=PdfListResponse)
async def list_pdfs():
    """List all uploaded PDFs with metadata.

    Returns:
        List of PDF metadata sorted by upload date (most recent first)
    """
    try:
        pdfs = []
        
        # Scan uploads directory for PDF folders
        for item in UPLOAD_DIR.iterdir():
            if item.is_dir() and item.name != ".gitkeep":
                metadata_path = item / "metadata.json"
                if metadata_path.exists():
                    try:
                        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
                        pdfs.append(PdfMetadata(**metadata))
                    except Exception as e:
                        print(f"Warning: Failed to load metadata for {item.name}: {e}")
                        continue
        
        # Sort by upload date (most recent first)
        pdfs.sort(key=lambda x: x.upload_date, reverse=True)
        
        return PdfListResponse(pdfs=pdfs)
    
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list PDFs: {str(e)}"
        ) from e


@app.get("/api/pdfs/{pdf_id}", response_model=PdfDetailResponse)
async def get_pdf_details(pdf_id: str):
    """Get details for a specific PDF.

    Args:
        pdf_id: ID of the PDF (folder name)

    Returns:
        PDF details including markdown, images, and ECM results if available

    Raises:
        HTTPException: If PDF not found or failed to load
    """
    try:
        pdf_dir = UPLOAD_DIR / pdf_id
        
        if not pdf_dir.exists():
            raise HTTPException(
                status_code=404,
                detail=f"PDF not found: {pdf_id}"
            )
        
        # Load metadata
        metadata_path = pdf_dir / "metadata.json"
        if not metadata_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Metadata not found for PDF: {pdf_id}"
            )
        
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        
        # Load markdown
        markdown_path = pdf_dir / "document.md"
        markdown = markdown_path.read_text(encoding="utf-8") if markdown_path.exists() else ""
        
        # Load images metadata (reconstruct from images directory)
        images = []
        images_dir = pdf_dir / "images"
        if images_dir.exists():
            for img_file in sorted(images_dir.iterdir()):
                if img_file.is_file():
                    # Parse filename: img_1_0.png -> page=1, idx=0
                    parts = img_file.stem.split("_")
                    if len(parts) >= 3 and parts[0] == "img":
                        page = int(parts[1])
                        idx = int(parts[2])
                        ext = img_file.suffix[1:]  # Remove leading dot
                        
                        from urllib.parse import quote
                        relative_path = f"{quote(pdf_id)}/images/{quote(img_file.name)}"
                        image_url = f"http://localhost:8000/uploads/{relative_path}"
                        
                        images.append({
                            "id": img_file.stem,
                            "page": page,
                            "format": ext,
                            "filename": img_file.name,
                            "url": image_url,
                            "path": str(img_file),
                        })
        
        # Load ECM results if available
        ecm_results = None
        ecm_results_path = pdf_dir / "ecm_results.json"
        if ecm_results_path.exists():
            ecm_results = json.loads(ecm_results_path.read_text(encoding="utf-8"))
        
        return PdfDetailResponse(
            id=metadata["id"],
            filename=metadata["filename"],
            markdown=markdown,
            images=images,
            ecm_results=ecm_results,
            upload_date=metadata["upload_date"],
        )
    
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load PDF details: {str(e)}"
        ) from e


@app.delete("/api/pdfs/{pdf_id}")
async def delete_pdf(pdf_id: str):
    """Delete a PDF and all its associated files.

    Args:
        pdf_id: ID of the PDF (folder name)

    Returns:
        Success message

    Raises:
        HTTPException: If PDF not found or failed to delete
    """
    try:
        pdf_dir = UPLOAD_DIR / pdf_id
        
        if not pdf_dir.exists():
            raise HTTPException(
                status_code=404,
                detail=f"PDF not found: {pdf_id}"
            )
        
        # Delete the entire directory
        shutil.rmtree(pdf_dir)
        
        return {
            "success": True,
            "message": f"PDF {pdf_id} deleted successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete PDF: {str(e)}"
        ) from e


@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """Chat with AI assistant about ECM data using the configured LLM provider.

    Args:
        request: Chat request with messages and ECM data context

    Returns:
        AI assistant response

    Raises:
        HTTPException: If chat fails
    """
    try:
        # Initialize LLM client
        llm_client = create_llm_client("chat")

        # Build system prompt with ECM data context
        system_prompt = f"""You are an expert energy analyst assistant helping users understand Energy Conservation Measure (ECM) data.

Here is the ECM data you're analyzing:
{json.dumps(request.ecm_data, indent=2)}

Your role:
- Answer questions about specific ECMs, their costs, savings, and payback periods
- Compare different measures and provide recommendations
- Explain technical terms in simple language
- Calculate totals, averages, and ROI when asked
- Provide insights on energy efficiency and cost-effectiveness

Be concise but informative. Use specific numbers from the data when relevant."""

        # Build messages array for the LLM
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(request.messages)

        # Call configured LLM provider
        response = llm_client.chat_completion(
            messages=messages,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
        )

        return ChatResponse(message=response)

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
            detail=f"Failed to process chat request: {str(e)}"
        ) from e


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    provider = get_llm_provider()
    config = get_config().get("llm", {})
    provider_config = config.get("providers", {}).get(provider, {})

    api_key = provider_config.get("api_key")
    if not api_key:
        env_var_map = {
            "cborg": "CBORG_API_KEY",
            "openrouter": "OPENROUTER_API_KEY",
        }
        env_var = env_var_map.get(provider)
        api_key = os.environ.get(env_var) if env_var else None

    has_api_key = bool(api_key)

    return {
        "status": "healthy",
        "llm_provider": provider,
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
