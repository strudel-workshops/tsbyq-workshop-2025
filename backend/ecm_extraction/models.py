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
    """Top-level record combining building, audit, and ECM data.

    Field names match the original ecm_cost_db schema for compatibility.
    """

    submission: Optional[SubmissionMetadata] = None
    building: Optional[BuildingSnapshot] = None
    ecm: EcmDetail
    audit: Optional[AuditInfo] = None

    def to_flat_dict(self) -> dict:
        """Flatten nested structure for frontend compatibility.

        Maps workshop schema to the format expected by the frontend UI.
        """
        flat = {}

        # Submission/Source fields
        if self.submission:
            flat["source_filename"] = self.submission.source_filename or ""
            flat["source_file_type"] = "pdf"
            flat["submitter_organization"] = self.submission.extracted_by or ""

        # Building fields
        if self.building:
            flat["building_name"] = self.building.building_name or ""
            flat["building_address"] = self.building.address or ""
            flat["primary_property_type"] = self.building.property_type or ""

            if self.building.gross_floor_area:
                flat["gross_floor_area"] = {
                    "value": self.building.gross_floor_area.value,
                    "unit": self.building.gross_floor_area.unit
                }
                flat["primary_property_type_area"] = {
                    "value": self.building.gross_floor_area.value,
                    "unit": self.building.gross_floor_area.unit
                }
            else:
                flat["gross_floor_area"] = {"value": 0, "unit": "sf"}
                flat["primary_property_type_area"] = {"value": 0, "unit": "sf"}

            # Required field with default
            flat["zip_code"] = {"value": 0, "unit": ""}
            flat["site_eui_at_audit"] = {"value": 0, "unit": "kBtu/sf"}

        # Audit fields
        if self.audit:
            flat["audit_type"] = self.audit.audit_type
            flat["audit_completion_date"] = self.audit.audit_date

        # ECM fields
        if self.ecm:
            flat["ecm_name"] = self.ecm.name
            flat["ecm_description"] = self.ecm.description or ""
            flat["ecm_additional_details"] = self.ecm.notes or ""
            flat["ecm_status"] = self.ecm.implementation_status or "recommended"
            flat["ecm_scope"] = self.ecm.ecm_category or "Other"

            # Financial fields - convert to ValueWithUnit format
            if self.ecm.cost_estimate:
                flat["implementation_cost"] = {
                    "value": self.ecm.cost_estimate.value,
                    "unit": self.ecm.cost_estimate.currency
                }
            else:
                flat["implementation_cost"] = {"value": 0, "unit": "USD"}

            # Incentives
            flat["incentives"] = {"value": 0, "unit": "USD"}

            # Lifetime
            if self.ecm.useful_life:
                flat["ecm_lifetime"] = {
                    "value": self.ecm.useful_life.value,
                    "unit": self.ecm.useful_life.unit
                }
            else:
                flat["ecm_lifetime"] = {"value": 15, "unit": "year"}

            # Savings entries - convert to array format
            savings_entries = []

            # Electric savings
            if self.ecm.annual_energy_savings:
                electric_entry = {
                    "fuel_type": "Electricity",
                    "energy_savings": {
                        "value": self.ecm.annual_energy_savings.value,
                        "unit": self.ecm.annual_energy_savings.unit
                    }
                }
                if self.ecm.annual_cost_savings:
                    electric_entry["cost_savings"] = {
                        "value": self.ecm.annual_cost_savings.value,
                        "unit": self.ecm.annual_cost_savings.currency
                    }
                if self.ecm.annual_demand_reduction:
                    electric_entry["demand_savings"] = {
                        "value": self.ecm.annual_demand_reduction,
                        "unit": "kW"
                    }
                savings_entries.append(electric_entry)

            # Add savings by fuel if available
            if self.ecm.savings_by_fuel:
                for fuel_saving in self.ecm.savings_by_fuel:
                    entry = {"fuel_type": fuel_saving.fuel_type}
                    if fuel_saving.energy_savings:
                        entry["energy_savings"] = {
                            "value": fuel_saving.energy_savings.value,
                            "unit": fuel_saving.energy_savings.unit
                        }
                    if fuel_saving.cost_savings:
                        entry["cost_savings"] = {
                            "value": fuel_saving.cost_savings.value,
                            "unit": fuel_saving.cost_savings.currency
                        }
                    if fuel_saving.demand_reduction:
                        entry["demand_savings"] = {
                            "value": fuel_saving.demand_reduction,
                            "unit": "kW"
                        }
                    savings_entries.append(entry)

            flat["savings_entries"] = savings_entries if savings_entries else []

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
