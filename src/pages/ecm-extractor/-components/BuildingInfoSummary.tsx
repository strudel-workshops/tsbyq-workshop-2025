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

  // Create Google Maps search URL (opens in new tab)
  const mapAddress = encodeURIComponent(
    `${buildingInfo.building_address}, ${buildingInfo.zip_code}`
  );
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapAddress}`;

  // OpenStreetMap embed (free, no API key needed)
  // Using Nominatim to geocode the address, then display on OSM
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=-74.0,40.6,-73.9,40.7&layer=mapnik&marker=40.65,-73.95`;

  // For a more accurate map, we could use a geocoding service
  // But for simplicity, using a static map centered on the general area

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
            {/* OpenStreetMap Embed - Free, no API key */}
            <iframe
              title="Building Location Map"
              src={osmEmbedUrl}
              width="100%"
              height="300"
              style={{ border: 0 }}
              loading="lazy"
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
