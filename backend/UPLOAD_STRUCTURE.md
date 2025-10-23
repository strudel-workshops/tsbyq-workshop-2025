# Upload File Organization

## Overview

The ECM Extractor now organizes uploaded PDF files and their extracted content into structured directories for better organization and persistence.

## Directory Structure

When a PDF is uploaded and processed, the following structure is created:

```
backend/uploads/
├── .gitkeep
└── {pdf-filename}/
    ├── document.md          # Extracted markdown content
    └── images/
        ├── img_1_0.png      # Image from page 1, index 0
        ├── img_1_1.jpeg     # Image from page 1, index 1
        ├── img_2_0.png      # Image from page 2, index 0
        └── ...
```

## File Naming Convention

- **PDF Folder**: Named after the uploaded PDF file (without extension)
  - Example: `building_audit_2024.pdf` → `building_audit_2024/`
- **Markdown File**: Always named `document.md`
- **Image Files**: Named as `img_{page}_{index}.{extension}`
  - `page`: Page number where image appears (1-indexed)
  - `index`: Image index on that page (0-indexed)
  - `extension`: Original image format (png, jpeg, jpg, etc.)

## Image URLs

Images are served via FastAPI's static file endpoint and referenced in markdown with full URLs:

```markdown
![Image from page 1](http://localhost:8000/uploads/building_audit_2024/images/img_1_0.png)
```

## Benefits

1. **Persistence**: Files remain on disk for review and debugging
2. **Organization**: Each PDF gets its own folder, making multi-document workflows easier
3. **Scalability**: No large base64 strings in memory
4. **Simplicity**: Frontend directly renders image URLs without transformation
5. **Extensibility**: Easy to add multiple PDFs per building/project in the future

## API Response

The `/api/extract-markdown` endpoint returns:

```json
{
  "markdown": "## Page 1\n\n...",
  "images": [
    {
      "id": "img_1_0",
      "page": 1,
      "format": "png",
      "filename": "img_1_0.png",
      "url": "http://localhost:8000/uploads/building_audit_2024/images/img_1_0.png",
      "path": "/Users/.../backend/uploads/building_audit_2024/images/img_1_0.png"
    }
  ],
  "output_dir": "/Users/.../backend/uploads/building_audit_2024"
}
```

## Cleanup

The temporary PDF file is deleted after processing, but the extracted folder structure is preserved. To clean up processed files, manually delete the folders under `backend/uploads/`.
