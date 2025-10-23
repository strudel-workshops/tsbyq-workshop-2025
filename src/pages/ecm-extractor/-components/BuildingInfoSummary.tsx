import { Paper, Typography, Divider, Box, Grid, Link } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
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

  // Create address string for maps
  const fullAddress = `${buildingInfo.building_address}, ${buildingInfo.zip_code}`;
  const mapAddress = encodeURIComponent(fullAddress);

  // Google Maps search URL (opens in new tab)
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapAddress}`;

  // Google Maps embed URL (works without API key for basic embedding)
  const googleMapsEmbedUrl = `https://www.google.com/maps?q=${mapAddress}&output=embed`;

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

      <Grid container spacing={3}>
        {/* Building Details */}
        <Grid item xs={12} md={6}>
          <LabelValueTable rows={buildingData} />
        </Grid>

        {/* Interactive Map */}
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              width: '100%',
              height: '100%',
              minHeight: 300,
              borderRadius: 1,
              overflow: 'hidden',
              border: 1,
              borderColor: 'divider',
              position: 'relative',
            }}
          >
            {/* Google Maps Embed - Uses address directly, no geocoding needed */}
            <iframe
              title="Building Location Map"
              src={googleMapsEmbedUrl}
              width="100%"
              height="300"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            {/* Link overlay at bottom */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 8,
                left: 8,
                right: 8,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: 1,
                p: 1,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Link
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                <MapIcon fontSize="small" />
                <Typography variant="body2">Open in Google Maps</Typography>
                <OpenInNewIcon fontSize="small" />
              </Link>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};
