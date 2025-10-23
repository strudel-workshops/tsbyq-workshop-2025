#!/bin/bash

# ECM Extractor Backend Startup Script

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting ECM Extractor Backend...${NC}"

# Check if .venv exists
if [ ! -d ".venv" ]; then
    echo -e "${YELLOW}Virtual environment not found. Creating one...${NC}"
    if command -v uv &> /dev/null; then
        echo -e "${GREEN}Using UV (fast)${NC}"
        uv venv
    else
        echo -e "${YELLOW}UV not found, using standard venv (slower)${NC}"
        python3 -m venv .venv
    fi
fi

# Activate virtual environment
echo -e "${GREEN}Activating virtual environment...${NC}"
source .venv/bin/activate

# Check if dependencies are installed
if [ ! -f ".venv/installed" ]; then
    echo -e "${YELLOW}Installing dependencies in editable mode...${NC}"
    if command -v uv &> /dev/null; then
        uv pip install -e .
    else
        pip install -e .
    fi
    touch .venv/installed
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}ERROR: .env file not found!${NC}"
    echo -e "${YELLOW}Please create a .env file with your CBORG_API_KEY${NC}"
    echo -e "Run: ${GREEN}cp .env.example .env${NC}"
    echo -e "Then edit .env and add your API key"
    exit 1
fi

# Create uploads directory if it doesn't exist
mkdir -p uploads

# Start the server
echo -e "${GREEN}Starting FastAPI server on http://localhost:8000${NC}"
uvicorn main:app --reload --port 8000
