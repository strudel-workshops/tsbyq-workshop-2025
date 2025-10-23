# Image Rendering Fix - Summary

## Problem

Images from uploaded PDFs were not rendering correctly in the markdown preview because:

1. Images were only stored in memory as base64 data
2. No persistent file storage
3. Complex regex replacement logic in the frontend was fragile

## Solution Implemented

### Backend Changes

1. **PDF Parser (`backend/ecm_extraction/pdf_parser.py`)**

   - Images now saved to disk in organized folders
   - Each PDF gets its own directory: `uploads/{pdf-name}/`
   - Images stored in: `uploads/{pdf-name}/images/`
   - Markdown saved as: `uploads/{pdf-name}/document.md`
   - Images referenced with full URLs in markdown

2. **API Endpoint (`backend/main.py`)**
   - Added static file serving: `app.mount("/uploads", StaticFiles(...))`
   - API response includes `output_dir` field
   - Temporary PDF deleted but extracted files persist

### Frontend Changes

1. **MarkdownPreview Component**

   - Removed complex regex replacement logic
   - Images render directly from URLs
   - Much simpler implementation

2. **Type Definitions**
   - Updated `ImageData` interface with new fields:
     - `filename`: Image filename
     - `url`: Full URL to access image
     - `path`: File system path

## File Organization

```
backend/uploads/
└── {pdf-filename}/
    ├── document.md
    └── images/
        ├── img_1_0.png
        ├── img_2_0.jpeg
        └── ...
```

## Testing Instructions

### 1. Backend is Running

✅ Backend server is currently running on http://localhost:8000

### 2. Start Frontend (in a new terminal)

```bash
npm run dev
```

### 3. Test the Fix

1. Navigate to http://localhost:5175
2. Go to the ECM Extractor page
3. Upload a PDF file that contains images
4. You should be redirected to the "Review and Edit Markdown" page
5. **Images should now render correctly!**

### 4. Verify File Structure

After uploading a PDF, check:

```bash
ls -la backend/uploads/{your-pdf-name}/
ls -la backend/uploads/{your-pdf-name}/images/
```

You should see:

- `document.md` - The extracted markdown
- `images/` directory with extracted images (`.png`, `.jpeg`, etc.)

### 5. View Markdown with Full URLs

Open `backend/uploads/{your-pdf-name}/document.md` and you'll see images referenced like:

```markdown
![Image from page 1](http://localhost:8000/uploads/{pdf-name}/images/img_1_0.png)
```

## Benefits

1. ✅ **Images persist on disk** - Easy to review and debug
2. ✅ **Better organization** - Each PDF in its own folder
3. ✅ **Scalable** - No large base64 strings in memory
4. ✅ **Simpler frontend** - Direct URL rendering
5. ✅ **Extensible** - Easy to add multiple PDFs per building/project

## Troubleshooting

### Images Still Not Rendering?

1. Check browser console for CORS errors
2. Verify backend server is running on port 8000
3. Check that files exist: `ls backend/uploads/{pdf-name}/images/`
4. Ensure image URLs in markdown match the format: `http://localhost:8000/uploads/...`

### Backend Not Starting?

Use the provided startup script:

```bash
cd backend
bash start.sh
```

This script:

- Creates/activates virtual environment
- Installs dependencies
- Starts the server with auto-reload

## Additional Documentation

See `backend/UPLOAD_STRUCTURE.md` for detailed information about the file organization structure.
