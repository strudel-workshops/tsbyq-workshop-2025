# ECM Extractor Backend

FastAPI backend service for extracting Energy Conservation Measures from building audit reports.

## Setup

### 1. Create Python Virtual Environment with UV

UV is a fast Python package installer and resolver. Make sure you have UV installed:

```bash
# Install UV if you haven't already
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Create a virtual environment and install dependencies:

```bash
cd backend
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv pip install -e .
```

This installs the package in editable mode, reading from `pyproject.toml`.

**Alternative: Traditional venv (slower)**

If you prefer not to use UV:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
```

### 3. Configure Environment Variables

Copy the example environment file and add your CBorg API key:

```bash
cp .env.example .env
```

Edit `.env` and set your API key:

```
CBORG_API_KEY=your_actual_api_key_here
CBORG_BASE_URL=https://api.cborg.lbl.gov
```

## Running the Server

### Quick Start (Recommended)

Use the provided startup script:

```bash
cd backend
./start.sh
```

This script will:

- Create a virtual environment if needed
- Install dependencies automatically
- Check for `.env` file
- Start the server with auto-reload

### Manual Start

If you prefer to start manually:

```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

### Check API Documentation

Once running, visit:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### POST /api/extract-markdown

Extract markdown and images from a PDF file.

**Request:**

- Content-Type: `multipart/form-data`
- Body: PDF file upload

**Response:**

```json
{
  "markdown": "# Extracted text...",
  "images": [
    {
      "id": "img_1_0",
      "page": 1,
      "format": "png",
      "data": "data:image/png;base64,..."
    }
  ]
}
```

### POST /api/extract-ecm

Extract ECM records from markdown using LLM.

**Request:**

```json
{
  "markdown": "# Building Audit Report\n..."
}
```

**Response:**

```json
{
  "records": [
    {
      "ecm_detail": {
        "name": "LED Lighting Upgrade",
        "cost_estimate": {"value": 5000, "currency": "USD"},
        ...
      },
      ...
    }
  ],
  "record_count": 1
}
```

## Testing the API

### Using curl

```bash
# Test health check
curl http://localhost:8000/health

# Extract markdown from PDF
curl -X POST http://localhost:8000/api/extract-markdown \
  -F "file=@path/to/audit.pdf"

# Extract ECM data
curl -X POST http://localhost:8000/api/extract-ecm \
  -H "Content-Type: application/json" \
  -d '{"markdown": "# Sample audit text..."}'
```

### Using Python

```python
import requests

# Extract markdown
with open("audit.pdf", "rb") as f:
    files = {"file": f}
    response = requests.post(
        "http://localhost:8000/api/extract-markdown",
        files=files
    )
    data = response.json()
    print(data["markdown"])

# Extract ECMs
response = requests.post(
    "http://localhost:8000/api/extract-ecm",
    json={"markdown": data["markdown"]}
)
ecms = response.json()
print(f"Found {ecms['record_count']} ECMs")
```

## Project Structure

```
backend/
├── main.py              # FastAPI application
├── pyproject.toml       # Python project config & dependencies
├── requirements.txt     # Legacy format (kept for compatibility)
├── start.sh             # Automated startup script
├── .env.example         # Environment template
├── .env                 # Your actual config (gitignored)
├── .gitignore          # Git ignore rules
├── .venv/              # Python virtual environment
├── uploads/            # Temporary PDF storage
└── ecm_extraction/     # Python package (editable install)
    ├── __init__.py
    ├── models.py        # Pydantic data models
    ├── llm_client.py    # CBorg API client
    ├── pdf_parser.py    # PDF text/image extraction
    └── extractor.py     # LLM-based ECM extraction
```

## Troubleshooting

### Port Already in Use

If port 8000 is already in use, change the port:

```bash
uvicorn main:app --reload --port 8001
```

Don't forget to update the CORS settings in `main.py` and the frontend API calls.

### Missing API Key

Error: `CBorg API key not found`

Solution: Make sure your `.env` file exists and contains `CBORG_API_KEY=your_key`

### Python Path Issues

If you see import errors for `ecm_extraction`, make sure you're running the server from the `backend/` directory.

## Development

The backend code is organized as:

- `main.py` - FastAPI endpoints
- `ecm_extraction/` - Python package with extraction logic (editable install)
  - `models.py` - Pydantic data models
  - `llm_client.py` - CBorg API client
  - `pdf_parser.py` - PDF text/image extraction
  - `extractor.py` - LLM-based ECM extraction

Since the package is installed in editable mode (`-e .`), any changes you make to the code in `ecm_extraction/` will be immediately available without reinstalling.
