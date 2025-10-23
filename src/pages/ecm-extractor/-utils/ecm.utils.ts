import {
  EcmData,
  BuildingInfo,
  EcmSummary,
  EcmTableRow,
  SavingsEntry,
} from '../-types/ecm.types';

/**
 * Extract building information from ECM data array
 */
export const extractBuildingInfo = (
  ecmData: EcmData[]
): BuildingInfo | null => {
  if (!ecmData || ecmData.length === 0) return null;

  const firstEcm = ecmData[0];
  return {
    building_name: firstEcm.building_name,
    building_address: firstEcm.building_address,
    zip_code: firstEcm.zip_code.value.toString(),
    primary_property_type: firstEcm.primary_property_type,
    gross_floor_area: firstEcm.gross_floor_area,
    site_eui_at_audit: firstEcm.site_eui_at_audit,
    submitter_organization: firstEcm.submitter_organization,
    climate_zone: firstEcm.climate_zone,
    bps_covered: firstEcm.bps_covered,
    bps_policy_name: firstEcm.bps_policy_name,
    has_energy_savings_target: firstEcm.has_energy_savings_target,
    energystar_score_at_audit: firstEcm.energystar_score_at_audit,
  };
};

/**
 * Calculate total cost savings from savings entries
 */
const calculateTotalCostSavings = (savingsEntries: SavingsEntry[]): number => {
  const totalEntry = savingsEntries.find(
    (entry) => entry.fuel_type === 'Total'
  );
  if (totalEntry?.cost_savings) {
    return totalEntry.cost_savings.value;
  }

  // If no total entry, sum individual fuel types
  return savingsEntries.reduce((sum, entry) => {
    return sum + (entry.cost_savings?.value || 0);
  }, 0);
};

/**
 * Calculate total energy savings by fuel type
 */
const calculateEnergySavings = (
  savingsEntries: SavingsEntry[],
  fuelType: string
): number => {
  const entry = savingsEntries.find((e) => e.fuel_type === fuelType);
  return entry?.energy_savings?.value || 0;
};

/**
 * Calculate total demand savings
 */
const calculateDemandSavings = (savingsEntries: SavingsEntry[]): number => {
  // Demand savings is typically only for electricity
  const electricityEntry = savingsEntries.find(
    (e) => e.fuel_type === 'Electricity'
  );
  return electricityEntry?.demand_savings?.value || 0;
};

/**
 * Transform ECM data into table row format
 */
export const transformToTableRows = (ecmData: EcmData[]): EcmTableRow[] => {
  return ecmData.map((ecm, index) => {
    const annualCostSavings = calculateTotalCostSavings(ecm.savings_entries);
    const netCost =
      ecm.implementation_cost.value - (ecm.incentives?.value || 0);
    const simplePayback =
      annualCostSavings > 0 ? netCost / annualCostSavings : Infinity;

    return {
      id: `ecm-${index}`,
      ecm_name: ecm.ecm_name,
      ecm_status: ecm.ecm_status,
      ecm_scope: ecm.ecm_scope,
      implementation_cost: ecm.implementation_cost.value,
      annual_cost_savings: annualCostSavings,
      incentives: ecm.incentives?.value || 0,
      lifetime: ecm.ecm_lifetime.value,
      simple_payback: simplePayback,
      electricity_savings: calculateEnergySavings(
        ecm.savings_entries,
        'Electricity'
      ),
      gas_savings: calculateEnergySavings(ecm.savings_entries, 'Natural Gas'),
      demand_savings: calculateDemandSavings(ecm.savings_entries),
      ecm_description: ecm.ecm_description,
      ecm_additional_details: ecm.ecm_additional_details,
      ecm_date_identified: ecm.ecm_date_identified,
      ecm_package_ids: ecm.ecm_package_ids,
    };
  });
};

/**
 * Calculate summary statistics from ECM data
 */
export const calculateEcmSummary = (ecmData: EcmData[]): EcmSummary => {
  const tableRows = transformToTableRows(ecmData);

  const totalImplementationCost = tableRows.reduce(
    (sum, ecm) => sum + ecm.implementation_cost,
    0
  );

  const totalAnnualSavings = tableRows.reduce(
    (sum, ecm) => sum + ecm.annual_cost_savings,
    0
  );

  const totalIncentives = tableRows.reduce(
    (sum, ecm) => sum + ecm.incentives,
    0
  );

  const validPaybacks = tableRows.filter(
    (ecm) => ecm.simple_payback !== Infinity && ecm.simple_payback > 0
  );
  const averagePaybackPeriod =
    validPaybacks.length > 0
      ? validPaybacks.reduce((sum, ecm) => sum + ecm.simple_payback, 0) /
        validPaybacks.length
      : Infinity;

  const totalElectricitySavings = tableRows.reduce(
    (sum, ecm) => sum + ecm.electricity_savings,
    0
  );

  const totalGasSavings = tableRows.reduce(
    (sum, ecm) => sum + ecm.gas_savings,
    0
  );

  return {
    total_ecms: ecmData.length,
    total_implementation_cost: totalImplementationCost,
    total_annual_savings: totalAnnualSavings,
    total_incentives: totalIncentives,
    average_payback_period: averagePaybackPeriod,
    total_electricity_savings: totalElectricitySavings,
    total_gas_savings: totalGasSavings,
  };
};
