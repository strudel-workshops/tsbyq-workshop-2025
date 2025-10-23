"""Simplified Pydantic models for ECM extraction - Workshop version.

This is a streamlined version of the full ecm_cost_db models,
focusing on essential functionality for the workshop.
"""

from __future__ import annotations
from typing import Optional, List
from pydantic import BaseModel, Field


class MoneyQuantity(BaseModel):
    """Monetary value with currency."""
    value: float = Field(..., description="Monetary amount")
    currency: str = Field(default="USD", description="Currency code (USD, EUR, etc.)")


class EnergyQuantity(BaseModel):
    """Energy value with unit."""
    value: float = Field(..., ge=0.0, description="Energy amount")
    unit: str = Field(..., description="Energy unit (kWh, MMBtu, etc.)")


class EUIQuantity(BaseModel):
    """Energy Use Intensity."""
    value: float = Field(..., ge=0.0)
    unit: str = Field(default="kBtu/sf/year")


class SavingsEntry(BaseModel):
    """Energy and cost savings for a specific fuel type."""
    fuel_type: Optional[str] = Field(None, description="Fuel type (electricity, natural gas, etc.)")
    energy_savings: Optional[EnergyQuantity] = None
    cost_savings: Optional[MoneyQuantity] = None
    demand_reduction: Optional[float] = Field(None, description="Peak demand reduction in kW")


class AreaQuantity(BaseModel):
    """Building area measurement."""
    value: float = Field(..., ge=0.0)
    unit: str = Field(default="sf", description="Area unit (sf, m2, etc.)")


class DurationQuantity(BaseModel):
    """Time duration."""
    value: float = Field(..., ge=0.0)
    unit: str = Field(..., description="Time unit (year, month, etc.)")


class BuildingSnapshot(BaseModel):
    """Basic building information."""
    building_id: Optional[str] = None
    building_name: Optional[str] = None
    address: Optional[str] = None
    property_type: Optional[str] = None
    gross_floor_area: Optional[AreaQuantity] = None
    year_built: Optional[int] = None


class AuditInfo(BaseModel):
    """Audit/assessment metadata."""
    audit_date: Optional[str] = None
    auditor_name: Optional[str] = None
    audit_type: Optional[str] = None


class EcmDetail(BaseModel):
    """Core ECM (Energy Conservation Measure) information."""

    # Basic Info
    name: str = Field(..., description="ECM name/title")
    description: Optional[str] = Field(None, description="Detailed description")
    ecm_category: Optional[str] = Field(None, description="Category (HVAC, Lighting, etc.)")

    # Financial
    cost_estimate: Optional[MoneyQuantity] = None
    annual_cost_savings: Optional[MoneyQuantity] = None
    simple_payback: Optional[DurationQuantity] = None

    # Energy Savings
    annual_energy_savings: Optional[EnergyQuantity] = None
    annual_demand_reduction: Optional[float] = Field(None, description="Peak demand reduction (kW)")
    savings_by_fuel: Optional[List[SavingsEntry]] = Field(
        default_factory=list,
        description="Detailed savings breakdown by fuel type"
    )

    # Implementation
    implementation_status: Optional[str] = Field(None, description="Status (recommended, implemented, etc.)")
    priority: Optional[str] = Field(None, description="Priority level (high, medium, low)")
    technical_feasibility: Optional[str] = None

    # Additional Details
    existing_equipment: Optional[str] = None
    proposed_equipment: Optional[str] = None
    useful_life: Optional[DurationQuantity] = None
    notes: Optional[str] = None


class SubmissionMetadata(BaseModel):
    """Metadata about the data submission."""
    source_filename: Optional[str] = None
    extraction_date: Optional[str] = None
    extracted_by: Optional[str] = Field(default="ECM Extractor Workshop Tool")


class ECMRecord(BaseModel):
    """Top-level record combining building, audit, and ECM data."""

    building_snapshot: Optional[BuildingSnapshot] = None
    audit_info: Optional[AuditInfo] = None
    ecm_detail: EcmDetail
    submission_metadata: Optional[SubmissionMetadata] = None

    def to_flat_dict(self) -> dict:
        """Flatten nested structure for database storage."""
        flat = {}

        # Building fields
        if self.building_snapshot:
            flat.update({
                "building_id": self.building_snapshot.building_id,
                "building_name": self.building_snapshot.building_name,
                "address": self.building_snapshot.address,
                "property_type": self.building_snapshot.property_type,
                "year_built": self.building_snapshot.year_built,
            })
            if self.building_snapshot.gross_floor_area:
                flat["gross_floor_area"] = self.building_snapshot.gross_floor_area.value
                flat["floor_area_unit"] = self.building_snapshot.gross_floor_area.unit

        # Audit fields
        if self.audit_info:
            flat.update({
                "audit_date": self.audit_info.audit_date,
                "auditor_name": self.audit_info.auditor_name,
                "audit_type": self.audit_info.audit_type,
            })

        # ECM fields
        ecm = self.ecm_detail
        flat.update({
            "ecm_name": ecm.name,
            "ecm_description": ecm.description,
            "ecm_category": ecm.ecm_category,
            "implementation_status": ecm.implementation_status,
            "priority": ecm.priority,
            "existing_equipment": ecm.existing_equipment,
            "proposed_equipment": ecm.proposed_equipment,
            "notes": ecm.notes,
        })

        if ecm.cost_estimate:
            flat["cost_estimate"] = ecm.cost_estimate.value
            flat["cost_currency"] = ecm.cost_estimate.currency

        if ecm.annual_cost_savings:
            flat["annual_cost_savings"] = ecm.annual_cost_savings.value
            flat["cost_savings_currency"] = ecm.annual_cost_savings.currency

        if ecm.annual_energy_savings:
            flat["annual_energy_savings"] = ecm.annual_energy_savings.value
            flat["energy_savings_unit"] = ecm.annual_energy_savings.unit

        if ecm.simple_payback:
            flat["simple_payback"] = ecm.simple_payback.value
            flat["payback_unit"] = ecm.simple_payback.unit

        if ecm.useful_life:
            flat["useful_life"] = ecm.useful_life.value
            flat["useful_life_unit"] = ecm.useful_life.unit

        flat["annual_demand_reduction_kw"] = ecm.annual_demand_reduction

        # Metadata
        if self.submission_metadata:
            flat.update({
                "source_filename": self.submission_metadata.source_filename,
                "extraction_date": self.submission_metadata.extraction_date,
            })

        return flat


class ECMExtractionResult(BaseModel):
    """Result of ECM extraction process."""

    records: List[ECMRecord] = Field(default_factory=list)
    markdown: Optional[str] = None
    source_filename: Optional[str] = None

    @property
    def record_count(self) -> int:
        return len(self.records)

    def to_flat_dicts(self) -> List[dict]:
        """Convert all records to flat dictionaries."""
        return [record.to_flat_dict() for record in self.records]
