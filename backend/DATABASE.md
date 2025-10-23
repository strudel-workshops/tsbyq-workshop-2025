# Database Implementation Guide

## Overview

The ECM Extractor now uses a **SQLite database with JSON storage** for managing PDFs and extracted ECM data. This hybrid approach combines the benefits of:

- **Database**: Fast queries, metadata management, relationship tracking
- **File Storage**: Images and markdown documents stored on disk

## Database Schema

### Tables

#### 1. `pdfs` - PDF Document Management

Stores metadata about uploaded PDFs and extracted content.

**Columns:**

- `id` (TEXT PRIMARY KEY): Unique identifier based on filename
- `filename` (TEXT): Original PDF filename
- `upload_date` (TEXT): ISO 8601 timestamp
- `file_path` (TEXT): Path to PDF folder in uploads/
- `page_count` (INTEGER): Number of pages
- `image_count` (INTEGER): Number of extracted images
- `markdown_text` (TEXT): Full extracted markdown content
- `has_ecm_data` (BOOLEAN): Whether ECM extraction completed
- `extraction_date` (TEXT): When ECM extraction occurred
- `created_at`, `updated_at` (TEXT): Timestamps

#### 2. `images` - Extracted Images

Tracks all images extracted from PDFs.

**Columns:**

- `id` (INTEGER PRIMARY KEY): Auto-increment ID
- `pdf_id` (TEXT FK → pdfs.id): Parent PDF
- `image_id` (TEXT): Image identifier (e.g., "img_1_0")
- `page_number` (INTEGER): Source page number
- `format` (TEXT): Image format (png, jpeg, etc.)
- `filename` (TEXT): Image filename
- `file_path` (TEXT): Full path to image file
- `url` (TEXT): Public URL for serving

#### 3. `ecm_extractions` - ECM Data (JSON Storage)

Stores extracted ECM data as JSON arrays.

**Columns:**

- `id` (INTEGER PRIMARY KEY): Auto-increment ID
- `pdf_id` (TEXT FK → pdfs.id): Parent PDF
- `raw_json` (TEXT): **Full JSON array of ECM records**
- `record_count` (INTEGER): Number of ECMs in array
- `llm_model` (TEXT): Model used for extraction
- `extraction_date` (TEXT): When extraction occurred
- `is_standardized` (BOOLEAN): For future standardization workflow
- `standardization_date` (TEXT): When standardized (future)

## File Structure

```
backend/
├── ecm_extractor.db          # SQLite database file
├── database.py               # Database configuration
├── db_models.py              # SQLAlchemy ORM models
├── init_db.py                # Database initialization script
└── uploads/                  # File storage (unchanged)
    └── {pdf_id}/
        ├── document.md       # Stored on disk
        ├── images/           # Stored on disk
        │   └── *.png
        ├── metadata.json     # DEPRECATED (migrated to DB)
        └── ecm_results.json  # DEPRECATED (migrated to DB)
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
uv pip install -e .
# or: pip install -e .
```

This installs SQLAlchemy 2.0+

### 2. Initialize Database

```bash
python init_db.py
```

This will:

1. Create the SQLite database file
2. Create all tables with proper schema
3. Optionally migrate existing file-based data to database

### 3. Migration from File-Based Storage

If you have existing data in the `uploads/` folder, the init script will:

- Scan all PDF folders
- Load `metadata.json` files
- Load `ecm_results.json` files
- Migrate everything to the database
- Keep images and markdown files on disk

**Note**: After migration, `metadata.json` and `ecm_results.json` files are no longer needed (but are kept for backup).

## Usage Examples

### Query PDFs

```python
from database import SessionLocal
from db_models import PDF

db = SessionLocal()

# Get all PDFs ordered by upload date
pdfs = db.query(PDF).order_by(PDF.upload_date.desc()).all()

# Get specific PDF with images
pdf = db.query(PDF).filter_by(id="EPIC_Report_970 Penn").first()
print(f"Images: {len(pdf.images)}")
print(f"Has ECM data: {pdf.has_ecm_data}")

db.close()
```

### Query ECM Extractions

```python
from db_models import ECMExtraction
import json

db = SessionLocal()

# Get latest extraction for a PDF
extraction = db.query(ECMExtraction)\
    .filter_by(pdf_id="EPIC_Report_970 Penn")\
    .order_by(ECMExtraction.extraction_date.desc())\
    .first()

# Parse JSON
ecm_records = json.loads(extraction.raw_json)
print(f"Found {len(ecm_records)} ECM records")

for ecm in ecm_records:
    print(f"- {ecm['ecm_name']}: ${ecm['implementation_cost']['value']}")

db.close()
```

### Search Within JSON (SQLite 3.38+)

```sql
-- Find all ECMs with "LED" in the name
SELECT
    pdf_id,
    json_extract(value, '$.ecm_name') as ecm_name,
    json_extract(value, '$.implementation_cost.value') as cost
FROM ecm_extractions, json_each(raw_json)
WHERE json_extract(value, '$.ecm_name') LIKE '%LED%';
```

### Get Summary Statistics

```sql
-- Total cost by PDF
SELECT
    p.filename,
    e.record_count,
    SUM(CAST(json_extract(value, '$.implementation_cost.value') AS REAL)) as total_cost
FROM pdfs p
JOIN ecm_extractions e ON p.id = e.pdf_id,
     json_each(e.raw_json)
GROUP BY p.id, p.filename, e.record_count;
```

## API Changes

The FastAPI endpoints now use the database:

### Upload PDF → Creates database records

```python
# Before: Created metadata.json
# After:  Creates PDF, Image records in database

POST /api/extract-markdown
→ Creates: PDF record + Image records
→ Stores: markdown in database, images on disk
```

### Extract ECM → Creates extraction record

```python
# Before: Created ecm_results.json
# After:  Creates ECMExtraction record with JSON

POST /api/extract-ecm
→ Creates: ECMExtraction record
→ Stores: Full JSON array in raw_json field
```

### List PDFs → Query database

```python
# Before: Scanned uploads/ directory
# After:  Queries pdfs table

GET /api/pdfs
→ Queries: SELECT * FROM pdfs ORDER BY upload_date DESC
```

## Benefits

### 1. **Fast Queries**

- Database indexes for common queries
- No need to scan filesystem
- Efficient filtering and sorting

### 2. **Flexible JSON Storage**

- Raw LLM output preserved exactly
- No schema migrations needed during development
- Easy to add new fields to JSON

### 3. **Relationships**

- Foreign keys ensure data integrity
- Cascade deletes (delete PDF → deletes images and extractions)
- Easy joins across tables

### 4. **Future-Ready**

- Easy to add `standardized_ecms` table later
- Can migrate to PostgreSQL with minimal changes
- Supports additional features (users, permissions, etc.)

## Migration Path

### Phase 1: Current (SQLite + JSON)

✅ Simple setup, no server required
✅ JSON storage for flexibility
✅ File storage for images/markdown

### Phase 2: Standardization (Future)

- Add `standardized_ecms` table
- Create mapping/normalization logic
- Link to original raw_json for traceability

### Phase 3: Scale (If Needed)

- Migrate SQLite → PostgreSQL
- Move files → S3/Cloud Storage
- Add full-text search (PostgreSQL's tsvector)
- Add analytics/dashboards

## Backup and Restore

### Backup

```bash
# Database
cp ecm_extractor.db ecm_extractor.backup.db

# Files
tar -czf uploads_backup.tar.gz uploads/
```

### Restore

```bash
# Database
cp ecm_extractor.backup.db ecm_extractor.db

# Files
tar -xzf uploads_backup.tar.gz
```

## Troubleshooting

### Database locked error

```python
# Solution: Ensure database sessions are properly closed
try:
    db = SessionLocal()
    # ... operations ...
finally:
    db.close()
```

### JSON parsing errors

```python
# Solution: Always validate JSON before storing
import json
try:
    json.loads(raw_json)
except json.JSONDecodeError as e:
    print(f"Invalid JSON: {e}")
```

### Missing relationships

```python
# Solution: Use eager loading
from sqlalchemy.orm import joinedload

pdf = db.query(PDF)\
    .options(joinedload(PDF.images))\
    .filter_by(id=pdf_id)\
    .first()
```

## Development Tips

1. **Use context managers** for database sessions:

```python
with SessionLocal() as db:
    pdf = db.query(PDF).first()
    # ... operations ...
    db.commit()
# Automatically closes
```

2. **Check SQL queries** being generated:

```python
from sqlalchemy import event
from sqlalchemy.engine import Engine

@event.listens_for(Engine, "before_cursor_execute")
def receive_before_cursor_execute(conn, cursor, statement, params, context, executemany):
    print(f"SQL: {statement}")
```

3. **Test database operations** in isolation:

```bash
python -c "from init_db import *; main()"
```
