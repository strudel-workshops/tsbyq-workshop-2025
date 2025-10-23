import { Paper, Typography, Divider } from '@mui/material';
import { BuildingInfo } from '../-types/ecm.types';
import { LabelValueTable } from '../../../components/LabelValueTable';

interface BuildingInfoSummaryProps {
  buildingInfo: BuildingInfo;
}

/**
 * Building Information Summary Component
 * Displays key building details extracted from ECM data
 */
export const BuildingInfoSummary: React.FC<BuildingInfoSummaryProps> = ({
  buildingInfo,
}) => {
  const buildingData = [
    { label: 'Building Name', value: buildingInfo.building_name },
    { label: 'Address', value: buildingInfo.building_address },
    { label: 'Zip Code', value: buildingInfo.zip_code },
    buildingInfo.climate_zone && {
      label: 'Climate Zone',
      value: `${buildingInfo.climate_zone.code} (${buildingInfo.climate_zone.scheme})`,
    },
    { label: 'Property Type', value: buildingInfo.primary_property_type },
    {
      label: 'Gross Floor Area',
      value: `${buildingInfo.gross_floor_area.value.toLocaleString()} ${buildingInfo.gross_floor_area.unit}`,
    },
    {
      label: 'Site EUI at Audit',
      value: `${buildingInfo.site_eui_at_audit.value} ${buildingInfo.site_eui_at_audit.unit}`,
    },
    buildingInfo.bps_covered !== undefined && {
      label: 'BPS Covered',
      value: buildingInfo.bps_covered ? 'Yes' : 'No',
    },
    buildingInfo.bps_policy_name && {
      label: 'BPS Policy',
      value: buildingInfo.bps_policy_name,
    },
    buildingInfo.has_energy_savings_target !== undefined && {
      label: 'Has Energy Savings Target',
      value: buildingInfo.has_energy_savings_target ? 'Yes' : 'No',
    },
    {
      label: 'Submitter Organization',
      value: buildingInfo.submitter_organization,
    },
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <Paper
      elevation={2}
      sx={{
        padding: 3,
      }}
    >
      <Typography variant="h6" component="h2" gutterBottom>
        Building Information
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <LabelValueTable rows={buildingData} />
    </Paper>
  );
};
