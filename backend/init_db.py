"""Initialize SQLite database and optionally migrate existing data."""

import json
import sys
from pathlib import Path
from datetime import datetime

# Add backend to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from database import init_db, SessionLocal
from db_models import PDF, Image, ECMExtraction


def migrate_existing_data(db_session, uploads_dir: Path):
    """Migrate data from file-based storage to database.
    
    Args:
        db_session: SQLAlchemy database session
        uploads_dir: Path to uploads directory
    """
    if not uploads_dir.exists():
        print("No uploads directory found, skipping migration")
        return
    
    migrated_count = 0
    
    # Iterate through each PDF folder
    for pdf_dir in uploads_dir.iterdir():
        if not pdf_dir.is_dir() or pdf_dir.name == ".gitkeep":
            continue
        
        metadata_path = pdf_dir / "metadata.json"
        if not metadata_path.exists():
            print(f"Skipping {pdf_dir.name} - no metadata.json found")
            continue
        
        try:
            # Load metadata
            metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
            
            # Check if PDF already exists in database
            existing_pdf = db_session.query(PDF).filter_by(id=metadata["id"]).first()
            if existing_pdf:
                print(f"Skipping {metadata['id']} - already in database")
                continue
            
            # Load markdown
            markdown_path = pdf_dir / "document.md"
            markdown_text = None
            if markdown_path.exists():
                markdown_text = markdown_path.read_text(encoding="utf-8")
            
            # Create PDF record
            pdf = PDF(
                id=metadata["id"],
                filename=metadata["filename"],
                upload_date=metadata["upload_date"],
                file_path=str(pdf_dir),
                image_count=metadata.get("image_count", 0),
                markdown_text=markdown_text,
                has_ecm_data=metadata.get("has_ecm_data", False),
                extraction_date=metadata.get("ecm_extraction_date"),
            )
            db_session.add(pdf)
            
            # Add images
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
                            relative_path = f"{quote(metadata['id'])}/images/{quote(img_file.name)}"
                            image_url = f"http://localhost:8000/uploads/{relative_path}"
                            
                            image = Image(
                                pdf_id=metadata["id"],
                                image_id=img_file.stem,
                                page_number=page,
                                format=ext,
                                filename=img_file.name,
                                file_path=str(img_file),
                                url=image_url,
                            )
                            db_session.add(image)
            
            # Add ECM extraction if available
            ecm_results_path = pdf_dir / "ecm_results.json"
            if ecm_results_path.exists():
                ecm_results = json.loads(ecm_results_path.read_text(encoding="utf-8"))
                
                extraction = ECMExtraction(
                    pdf_id=metadata["id"],
                    raw_json=json.dumps(ecm_results),
                    record_count=len(ecm_results),
                    extraction_date=metadata.get("ecm_extraction_date"),
                )
                db_session.add(extraction)
            
            db_session.commit()
            migrated_count += 1
            print(f"✓ Migrated: {metadata['filename']}")
            
        except Exception as e:
            print(f"✗ Failed to migrate {pdf_dir.name}: {e}")
            db_session.rollback()
            continue
    
    print(f"\nMigration complete: {migrated_count} PDFs migrated")


def main():
    """Initialize database and optionally migrate data."""
    print("=" * 60)
    print("ECM Extractor Database Initialization")
    print("=" * 60)
    
    # Initialize database schema
    print("\n1. Creating database schema...")
    init_db()
    print("✓ Database schema created")
    
    # Ask about migration
    uploads_dir = Path(__file__).parent / "uploads"
    if uploads_dir.exists():
        print(f"\n2. Found existing uploads directory: {uploads_dir}")
        response = input("   Migrate existing data to database? (y/n): ").strip().lower()
        
        if response == 'y':
            print("\n   Starting migration...")
            db = SessionLocal()
            try:
                migrate_existing_data(db, uploads_dir)
            finally:
                db.close()
        else:
            print("   Skipping migration")
    else:
        print("\n2. No existing uploads directory found")
    
    print("\n" + "=" * 60)
    print("Database initialization complete!")
    print("=" * 60)
    print(f"\nDatabase location: {Path(__file__).parent / 'ecm_extractor.db'}")
    print("\nYou can now start the FastAPI server:")
    print("  uvicorn main:app --reload --port 8000")


if __name__ == "__main__":
    main()
