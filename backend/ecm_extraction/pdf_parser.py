"""PDF parsing with PyMuPDF for text and image extraction."""

from __future__ import annotations
import base64
from pathlib import Path
from typing import List, Dict, Any
from urllib.parse import quote
import fitz  # PyMuPDF


class PDFParseResult:
    """Result of PDF parsing containing markdown and images."""

    def __init__(self, markdown: str, images: List[Dict[str, Any]], output_dir: str | None = None):
        self.markdown = markdown
        self.images = images
        self.output_dir = output_dir

    def to_dict(self) -> Dict[str, Any]:
        return {
            "markdown": self.markdown,
            "images": self.images,
            "output_dir": self.output_dir,
        }


def extract_markdown_with_images(
    pdf_path: str | Path, 
    output_dir: str | Path | None = None,
    base_url: str = "http://localhost:8000"
) -> PDFParseResult:
    """Extract text and images from PDF, saving to organized folders.

    Args:
        pdf_path: Path to PDF file
        output_dir: Directory to save markdown and images. If None, creates folder based on PDF name.
        base_url: Base URL for serving images (default: http://localhost:8000)

    Returns:
        PDFParseResult with markdown text, image metadata, and output directory path

    Example:
        result = extract_markdown_with_images("audit_report.pdf")
        print(result.markdown)
        print(f"Files saved to: {result.output_dir}")
    """
    pdf_path = Path(pdf_path)
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")

    # Create output directory structure: uploads/{pdf_name}/
    if output_dir is None:
        pdf_name = pdf_path.stem  # filename without extension
        output_dir = pdf_path.parent / pdf_name
    else:
        output_dir = Path(output_dir)
    
    # Create images subdirectory
    images_dir = output_dir / "images"
    images_dir.mkdir(parents=True, exist_ok=True)

    doc = fitz.open(pdf_path)
    markdown_parts = []
    images = []

    for page_num in range(len(doc)):
        page = doc[page_num]
        page_number = page_num + 1

        # Extract text from page
        text = page.get_text("text")

        # Add page header
        markdown_parts.append(f"## Page {page_number}\n\n")

        if text.strip():
            markdown_parts.append(f"{text}\n\n")
        else:
            markdown_parts.append("*[No text content on this page]*\n\n")

        # Extract images from page
        image_list = page.get_images()

        for img_idx, img in enumerate(image_list):
            try:
                xref = img[0]  # Image XREF number
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]
                ext = base_image["ext"]  # Image extension (png, jpeg, etc.)

                image_id = f"img_{page_number}_{img_idx}"
                image_filename = f"{image_id}.{ext}"
                
                # Save image to disk
                image_path = images_dir / image_filename
                image_path.write_bytes(image_bytes)

                # Create URL path relative to uploads directory (URL-encode for spaces and special chars)
                relative_path = f"{quote(output_dir.name)}/images/{quote(image_filename)}"
                image_url = f"{base_url}/uploads/{relative_path}"

                # Store image metadata
                images.append({
                    "id": image_id,
                    "page": page_number,
                    "format": ext,
                    "filename": image_filename,
                    "url": image_url,
                    "path": str(image_path),
                })

                # Add image reference in markdown with full URL
                markdown_parts.append(f"![Image from page {page_number}]({image_url})\n\n")

            except Exception as e:
                # Skip problematic images
                print(f"Warning: Could not extract image {img_idx} from page {page_number}: {e}")
                continue

        # Add page separator
        markdown_parts.append("---\n\n")

    doc.close()

    markdown_text = "".join(markdown_parts)
    
    # Save markdown to file
    markdown_path = output_dir / "document.md"
    markdown_path.write_text(markdown_text, encoding="utf-8")

    return PDFParseResult(
        markdown=markdown_text,
        images=images,
        output_dir=str(output_dir),
    )


def save_markdown(markdown: str, output_path: str | Path):
    """Save markdown text to file.

    Args:
        markdown: Markdown content
        output_path: Path to save markdown file
    """
    output_path = Path(output_path)
    output_path.write_text(markdown, encoding="utf-8")


def save_images(images: List[Dict[str, Any]], output_dir: str | Path):
    """Save extracted images to directory.

    Args:
        images: List of image dicts from PDFParseResult
        output_dir: Directory to save images
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    for img in images:
        img_id = img["id"]
        ext = img["format"]
        b64_data = img["data"].split(",")[1]  # Remove data URI prefix

        # Decode base64
        image_bytes = base64.b64decode(b64_data)

        # Save to file
        output_path = output_dir / f"{img_id}.{ext}"
        output_path.write_bytes(image_bytes)
