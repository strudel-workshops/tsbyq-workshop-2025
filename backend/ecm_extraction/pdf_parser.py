"""PDF parsing with PyMuPDF for text and image extraction."""

from __future__ import annotations
import base64
from pathlib import Path
from typing import List, Dict, Any
import fitz  # PyMuPDF


class PDFParseResult:
    """Result of PDF parsing containing markdown and images."""

    def __init__(self, markdown: str, images: List[Dict[str, Any]]):
        self.markdown = markdown
        self.images = images

    def to_dict(self) -> Dict[str, Any]:
        return {
            "markdown": self.markdown,
            "images": self.images,
        }


def extract_markdown_with_images(pdf_path: str | Path) -> PDFParseResult:
    """Extract text and images from PDF.

    Args:
        pdf_path: Path to PDF file

    Returns:
        PDFParseResult with markdown text and base64-encoded images

    Example:
        result = extract_markdown_with_images("audit_report.pdf")
        print(result.markdown)
        for img in result.images:
            print(f"Image {img['id']} on page {img['page']}")
    """
    pdf_path = Path(pdf_path)
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")

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

                # Convert to base64
                b64_data = base64.b64encode(image_bytes).decode("utf-8")
                image_id = f"img_{page_number}_{img_idx}"

                images.append({
                    "id": image_id,
                    "page": page_number,
                    "format": ext,
                    "data": f"data:image/{ext};base64,{b64_data}",
                })

                # Add image reference in markdown (will be replaced in preview)
                markdown_parts.append(f"![Image from page {page_number}]({image_id})\n\n")

            except Exception as e:
                # Skip problematic images
                print(f"Warning: Could not extract image {img_idx} from page {page_number}: {e}")
                continue

        # Add page separator
        markdown_parts.append("---\n\n")

    doc.close()

    markdown_text = "".join(markdown_parts)

    return PDFParseResult(
        markdown=markdown_text,
        images=images,
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
