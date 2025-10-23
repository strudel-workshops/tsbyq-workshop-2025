# Multi-PDF Management Feature

This document describes the multi-PDF management system implemented for the ECM Extractor.

## Overview

The ECM Extractor now supports uploading, managing, and viewing multiple PDFs with full persistence across browser sessions.

## Features

### 1. **Upload Multiple PDFs**

- Upload PDFs one at a time
- Each PDF is stored in its own organized folder
- All data persists on disk

### 2. **View Previously Uploaded PDFs**

- List shows all uploaded PDFs sorted by most recent first
- Each card displays:
  - PDF filename
  - Upload date and time
  - Number of images extracted
  - Whether ECM data has been extracted (green badge)

### 3. **Navigate Between PDFs**

- Click "View/Edit" to load a previously uploaded PDF
- Automatically navigates to:
  - Staging page if no ECM data exists
  - Results page if ECM data has been extracted

### 4. **Delete PDFs**

- Click "Delete" button on any PDF card
- Confirmation dialog prevents accidental deletion
- Removes all associated files (markdown, images, ECM data)

### 5. **Data Persistence**

- All PDF data saved to disk in organized folders
- ECM extraction results saved as JSON
- Metadata tracks upload dates and status
- Everything persists across browser sessions

## File Structure

Each uploaded PDF has the following structure:

```
backend/uploads/
└── {pdf-filename}/
    ├── metadata.json          # Upload date, image count, ECM status
    ├── document.md            # Extracted markdown
    ├── ecm_results.json       # ECM extraction results (if extracted)
    └── images/
        ├── img_1_0.png        # Images from PDF
        └── ...
```

### metadata.json

```json
{
  "id": "Building_Audit_2024",
  "filename": "Building_Audit_2024.pdf",
  "upload_date": "2025-10-23T13:30:00.000000",
  "image_count": 6,
  "has_ecm_data": true,
  "ecm_extraction_date": "2025-10-23T13:35:00.000000"
}
```

### ecm_results.json

Stores the extracted ECM records in JSON format, allowing users to revisit results without re-running extraction.

## API Endpoints

### GET /api/pdfs

Lists all uploaded PDFs with metadata.

**Response:**

```json
{
  "pdfs": [
    {
      "id": "Building_Audit_2024",
      "filename": "Building_Audit_2024.pdf",
      "upload_date": "2025-10-23T13:30:00",
      "image_count": 6,
      "has_ecm_data": true
    }
  ]
}
```

### GET /api/pdfs/{pdf_id}

Retrieves all data for a specific PDF.

**Response:**

```json
{
  "id": "Building_Audit_2024",
  "filename": "Building_Audit_2024.pdf",
  "markdown": "## Page 1\n\n...",
  "images": [...],
  "ecm_results": [...],
  "upload_date": "2025-10-23T13:30:00"
}
```

### DELETE /api/pdfs/{pdf_id}

Deletes a PDF and all its associated files.

**Response:**

```json
{
  "success": true,
  "message": "PDF Building_Audit_2024 deleted successfully"
}
```

### POST /api/extract-ecm

Updated to accept optional `pdf_id` parameter to save results.

**Request:**

```json
{
  "markdown": "...",
  "pdf_id": "Building_Audit_2024"
}
```

## Frontend State Management

### New State Fields

- `uploadedPdfs: PdfMetadata[]` - List of all PDFs
- `currentPdfId: string | null` - Currently viewing PDF

### New Actions

- `SET_UPLOADED_PDFS_LIST` - Update PDF list
- `LOAD_PDF_DATA` - Load specific PDF data
- `DELETE_PDF_FROM_LIST` - Remove PDF from list
- `SET_CURRENT_PDF_ID` - Track current PDF

## User Workflow

### Upload New PDF

1. User uploads PDF on upload page
2. Backend extracts markdown and images
3. Creates metadata.json
4. Adds to PDF list
5. Navigate to staging page

### View Existing PDF

1. User clicks "View/Edit" on PDF card
2. Frontend fetches PDF data from backend
3. Loads data into state
4. Navigates to staging or results page

### Delete PDF

1. User clicks "Delete" button
2. Confirmation dialog appears
3. If confirmed, backend deletes folder
4. Frontend removes from list
5. Clears data if it was being viewed

### Extract ECM Data

1. User edits markdown on staging page
2. Clicks "Extract ECM Data"
3. Backend processes with LLM
4. Saves results to `ecm_results.json`
5. Updates metadata
6. Navigate to results page

## UI Components

### PdfListCard

- Material UI Card component
- Shows PDF metadata
- "View/Edit" and "Delete" buttons
- Delete confirmation dialog

### Upload Page

- PDF upload area (drag & drop)
- Grid of previously uploaded PDFs
- Sorted by most recent first
- Responsive layout (3 columns on desktop)

## Benefits

✅ **Multi-document workflows** - Work with multiple PDFs
✅ **Data persistence** - Nothing lost between sessions
✅ **Easy navigation** - Jump between PDFs
✅ **Space management** - Delete old PDFs
✅ **Progress tracking** - See which PDFs have ECM data
✅ **No re-processing** - View saved results instantly

## Testing

1. **Upload a PDF**

   - Go to ECM Extractor page
   - Upload a PDF
   - Verify it appears in the list after processing

2. **View a PDF**

   - Click "View/Edit" on a PDF card
   - Verify correct markdown and images load
   - Check navigation goes to correct page

3. **Delete a PDF**

   - Click "Delete" on a PDF card
   - Confirm deletion
   - Verify PDF removed from list and disk

4. **Multiple PDFs**

   - Upload 2-3 different PDFs
   - Switch between them
   - Verify each loads correctly

5. **ECM Persistence**
   - Extract ECM data for a PDF
   - Navigate away and back
   - Click "View/Edit" again
   - Verify it goes to results page with saved data

## Technical Notes

- Backend uses FastAPI with file-based storage
- Frontend uses React with TanStack Router
- State managed with useReducer
- Material UI for components
- All dates in ISO 8601 format
- PDF IDs are folder names (URL-encoded for spaces)
