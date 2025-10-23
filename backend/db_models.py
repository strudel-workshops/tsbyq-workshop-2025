"""SQLAlchemy models for ECM Extractor database."""

from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from database import Base


class PDF(Base):
    """PDF document with extracted content."""
    
    __tablename__ = "pdfs"
    
    id = Column(String, primary_key=True)  # Based on filename
    filename = Column(String(255), nullable=False)
    upload_date = Column(String, nullable=False)  # ISO 8601 format
    file_path = Column(Text)
    page_count = Column(Integer)
    image_count = Column(Integer, default=0)
    
    # Extracted content
    markdown_text = Column(Text)
    
    # Status tracking
    has_ecm_data = Column(Boolean, default=False)
    extraction_date = Column(String)
    
    # Metadata
    created_at = Column(String, default=lambda: datetime.utcnow().isoformat())
    updated_at = Column(String, default=lambda: datetime.utcnow().isoformat())
    
    # Relationships
    images = relationship("Image", back_populates="pdf", cascade="all, delete-orphan")
    ecm_extractions = relationship("ECMExtraction", back_populates="pdf", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<PDF(id={self.id}, filename={self.filename})>"


# Index on upload_date for sorting
Index('idx_pdfs_upload_date', PDF.upload_date.desc())


class Image(Base):
    """Extracted image from PDF."""
    
    __tablename__ = "images"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    pdf_id = Column(String, ForeignKey("pdfs.id", ondelete="CASCADE"), nullable=False)
    image_id = Column(String(50), nullable=False)  # e.g., "img_1_0"
    page_number = Column(Integer, nullable=False)
    format = Column(String(10), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(Text)
    url = Column(Text)
    
    created_at = Column(String, default=lambda: datetime.utcnow().isoformat())
    
    # Relationships
    pdf = relationship("PDF", back_populates="images")
    
    def __repr__(self):
        return f"<Image(id={self.id}, image_id={self.image_id})>"


# Indexes for images
Index('idx_images_pdf', Image.pdf_id)


class ECMExtraction(Base):
    """ECM extraction result stored as JSON."""
    
    __tablename__ = "ecm_extractions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    pdf_id = Column(String, ForeignKey("pdfs.id", ondelete="CASCADE"), nullable=False)
    
    # Store the entire extracted JSON array
    raw_json = Column(Text, nullable=False)  # JSON array of ECM records
    record_count = Column(Integer)
    
    # LLM metadata
    llm_model = Column(String)
    extraction_date = Column(String, default=lambda: datetime.utcnow().isoformat())
    
    # Status for later refinement
    is_standardized = Column(Boolean, default=False)
    standardization_date = Column(String)
    
    created_at = Column(String, default=lambda: datetime.utcnow().isoformat())
    
    # Relationships
    pdf = relationship("PDF", back_populates="ecm_extractions")
    
    def __repr__(self):
        return f"<ECMExtraction(id={self.id}, pdf_id={self.pdf_id}, records={self.record_count})>"


# Indexes for ecm_extractions
Index('idx_extractions_pdf', ECMExtraction.pdf_id)
Index('idx_extractions_status', ECMExtraction.is_standardized)
