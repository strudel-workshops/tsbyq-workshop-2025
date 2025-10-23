/**
 * TypeScript types for ECM (Energy Conservation Measure) data
 */

export interface ValueWithUnit {
  value: number;
  unit: string;
}

export interface SavingsEntry {
  fuel_type: string;
  energy_savings?: ValueWithUnit;
  cost_savings?: ValueWithUnit;
  demand_savings?: ValueWithUnit;
  other_energy_type_label?: string;
}

export interface EcmData {
  submitter_organization: string;
  source_filename: string;
  source_file_type: string;
  building_name: string;
  building_address: string;
  zip_code: ValueWithUnit;
  primary_property_type: string;
  primary_property_type_area: ValueWithUnit;
  gross_floor_area: ValueWithUnit;
  ecm_name: string;
  ecm_description: string;
  ecm_additional_details?: string;
  ecm_status: string;
  ecm_scope: string;
  ecm_date_identified?: string;
  savings_entries: SavingsEntry[];
  implementation_cost: ValueWithUnit;
  incentives?: ValueWithUnit;
  ecm_lifetime: ValueWithUnit;
  ecm_package_ids?: string[];
  site_eui_at_audit: ValueWithUnit;
  audit_type?: string;
  audit_completion_date?: string;
  energystar_score_at_audit?: number;
  audit_for_bps_compliance?: boolean;
  bps_covered?: boolean;
  bps_policy_name?: string;
  has_energy_savings_target?: boolean;
  climate_zone?: {
    scheme: string;
    code: string;
  };
}

export interface BuildingInfo {
  building_name: string;
  building_address: string;
  zip_code: string;
  primary_property_type: string;
  gross_floor_area: ValueWithUnit;
  site_eui_at_audit: ValueWithUnit;
  submitter_organization: string;
  climate_zone?: {
    scheme: string;
    code: string;
  };
  bps_covered?: boolean;
  bps_policy_name?: string;
  has_energy_savings_target?: boolean;
  energystar_score_at_audit?: number;
}

export interface EcmSummary {
  total_ecms: number;
  total_implementation_cost: number;
  total_annual_savings: number;
  total_incentives: number;
  average_payback_period: number;
  total_electricity_savings: number;
  total_gas_savings: number;
}

export interface EcmTableRow {
  id: string;
  ecm_name: string;
  ecm_status: string;
  ecm_scope: string;
  implementation_cost: number;
  annual_cost_savings: number;
  incentives: number;
  lifetime: number;
  simple_payback: number;
  electricity_savings: number;
  gas_savings: number;
  demand_savings: number;
  ecm_description: string;
  ecm_additional_details?: string;
  ecm_date_identified?: string;
  ecm_package_ids?: string[];
}
