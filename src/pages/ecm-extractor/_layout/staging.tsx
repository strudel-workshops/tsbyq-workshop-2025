import {
  Box,
  Button,
  Container,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEcmExtractor } from '../-context/ContextProvider';
import {
  setEditedMarkdown,
  setEcmResults,
  setLoading,
} from '../-context/actions';
import { MarkdownEditor } from '../-components/MarkdownEditor';
import { MarkdownPreview } from '../-components/MarkdownPreview';

export const Route = createFileRoute('/ecm-extractor/_layout/staging')({
  component: StagingPage,
});

/**
 * Step 2: Staging page with markdown editor and preview
 */
function StagingPage() {
  const { state, dispatch } = useEcmExtractor();
  const navigate = useNavigate();

  const handleMarkdownChange = (newMarkdown: string) => {
    dispatch(setEditedMarkdown(newMarkdown));
  };

  const handleExtract = () => {
    // Simulate ECM extraction process
    dispatch(setLoading(true));

    // Mock extraction using real ECM data structure
    // In production, replace this with actual API call to your backend parser
    setTimeout(() => {
      const mockResults = [
        {
          submitter_organization:
            'Sustainable Real Estate Solutions, Inc. (SRS)',
          source_filename: state.fileName,
          source_file_type: 'PDF',
          building_name: '970 Penn',
          building_address: '970 Pennsylvania St',
          zip_code: {
            value: '80203',
          },
          climate_zone: {
            scheme: 'ASHRAE',
            code: '5B',
          },
          primary_property_type: 'Multifamily Housing',
          primary_property_type_area: {
            value: 24416.0,
            unit: 'sqft',
          },
          gross_floor_area: {
            value: 24416.0,
            unit: 'sqft',
          },
          bps_covered: true,
          bps_policy_name: 'Building Energy Performance Standards',
          has_energy_savings_target: true,
          audit_type: 'ASHRAE Level 2 Audit',
          audit_completion_date: '2024-03-15',
          energystar_score_at_audit: 68,
          audit_for_bps_compliance: true,
          ecm_name: 'Roof Replacement',
          ecm_description: 'Replacement of the existing roof.',
          ecm_status: 'Identified',
          ecm_scope: 'Measure',
          ecm_date_identified: '2024-03-20',
          savings_entries: [
            {
              fuel_type: 'Electricity',
              energy_savings: {
                value: 708.0,
                unit: 'kWh',
              },
            },
            {
              fuel_type: 'Natural Gas',
              energy_savings: {
                value: 474.0,
                unit: 'therm',
              },
            },
            {
              fuel_type: 'Total',
              cost_savings: {
                value: 504.0,
                unit: 'USD',
              },
            },
          ],
          implementation_cost: {
            value: 75590.0,
            unit: 'USD',
          },
          ecm_lifetime: {
            value: 25.0,
            unit: 'year',
          },
          site_eui_at_audit: {
            value: 59.1,
            unit: 'kBtu/sf',
          },
        },
        {
          submitter_organization:
            'Sustainable Real Estate Solutions, Inc. (SRS)',
          source_filename: state.fileName,
          source_file_type: 'PDF',
          building_name: '970 Penn',
          building_address: '970 Pennsylvania St',
          zip_code: {
            value: '80203',
          },
          climate_zone: {
            scheme: 'ASHRAE',
            code: '5B',
          },
          primary_property_type: 'Multifamily Housing',
          primary_property_type_area: {
            value: 24416.0,
            unit: 'sqft',
          },
          gross_floor_area: {
            value: 24416.0,
            unit: 'sqft',
          },
          bps_covered: true,
          bps_policy_name: 'Building Energy Performance Standards',
          has_energy_savings_target: true,
          audit_type: 'ASHRAE Level 2 Audit',
          audit_completion_date: '2024-03-15',
          energystar_score_at_audit: 68,
          audit_for_bps_compliance: true,
          ecm_name: 'LED Lighting',
          ecm_description: 'Upgrade to LED lighting fixtures.',
          ecm_additional_details: 'Total Capacity Replaced: 100.0%',
          ecm_status: 'Identified',
          ecm_scope: 'Measure',
          ecm_date_identified: '2024-03-20',
          savings_entries: [
            {
              fuel_type: 'Electricity',
              energy_savings: {
                value: 15410.0,
                unit: 'kWh',
              },
              cost_savings: {
                value: 2188.0,
                unit: 'USD',
              },
              demand_savings: {
                value: 5.2,
                unit: 'kW',
              },
            },
          ],
          implementation_cost: {
            value: 10756.0,
            unit: 'USD',
          },
          incentives: {
            value: 5378.0,
            unit: 'USD',
          },
          ecm_lifetime: {
            value: 20.0,
            unit: 'year',
          },
          site_eui_at_audit: {
            value: 59.1,
            unit: 'kBtu/sf',
          },
        },
        {
          submitter_organization:
            'Sustainable Real Estate Solutions, Inc. (SRS)',
          source_filename: state.fileName,
          source_file_type: 'PDF',
          building_name: '970 Penn',
          building_address: '970 Pennsylvania St',
          zip_code: {
            value: '80203',
          },
          climate_zone: {
            scheme: 'ASHRAE',
            code: '5B',
          },
          primary_property_type: 'Multifamily Housing',
          primary_property_type_area: {
            value: 24416.0,
            unit: 'sqft',
          },
          gross_floor_area: {
            value: 24416.0,
            unit: 'sqft',
          },
          bps_covered: true,
          bps_policy_name: 'Building Energy Performance Standards',
          has_energy_savings_target: true,
          audit_type: 'ASHRAE Level 2 Audit',
          audit_completion_date: '2024-03-15',
          energystar_score_at_audit: 68,
          audit_for_bps_compliance: true,
          ecm_name: 'Variable Refrigerant Flow',
          ecm_description:
            'Installation of a Variable Refrigerant Flow (VRF) system for heating and cooling.',
          ecm_additional_details:
            'Total Capacity: 62 Ton; Replacement IEER: 24.7; Total Capacity Replaced: 100.0%; Replacement CoP: 4.2',
          ecm_status: 'Identified',
          ecm_scope: 'Measure',
          ecm_date_identified: '2024-03-20',
          savings_entries: [
            {
              fuel_type: 'Electricity',
              energy_savings: {
                value: 1622.0,
                unit: 'kWh',
              },
              demand_savings: {
                value: 8.5,
                unit: 'kW',
              },
            },
            {
              fuel_type: 'Natural Gas',
              energy_savings: {
                value: 7391.0,
                unit: 'therm',
              },
            },
            {
              fuel_type: 'Total',
              cost_savings: {
                value: 6515.0,
                unit: 'USD',
              },
            },
          ],
          implementation_cost: {
            value: 515564.0,
            unit: 'USD',
          },
          incentives: {
            value: 289500.0,
            unit: 'USD',
          },
          ecm_lifetime: {
            value: 20.0,
            unit: 'year',
          },
          site_eui_at_audit: {
            value: 59.1,
            unit: 'kBtu/sf',
          },
        },
        {
          submitter_organization:
            'Sustainable Real Estate Solutions, Inc. (SRS)',
          source_filename: state.fileName,
          source_file_type: 'PDF',
          building_name: '970 Penn',
          building_address: '970 Pennsylvania St',
          zip_code: {
            value: '80203',
          },
          climate_zone: {
            scheme: 'ASHRAE',
            code: '5B',
          },
          primary_property_type: 'Multifamily Housing',
          primary_property_type_area: {
            value: 24416.0,
            unit: 'sqft',
          },
          gross_floor_area: {
            value: 24416.0,
            unit: 'sqft',
          },
          bps_covered: true,
          bps_policy_name: 'Building Energy Performance Standards',
          has_energy_savings_target: true,
          audit_type: 'ASHRAE Level 2 Audit',
          audit_completion_date: '2024-03-15',
          energystar_score_at_audit: 68,
          audit_for_bps_compliance: true,
          ecm_name: 'Solar PV-11kW',
          ecm_description:
            'Installation of an 11 kW DC Solar Photovoltaic system.',
          ecm_additional_details:
            'Size: 11.00 kW DC; Investment Tax Credit: 30%; REC Term: 20 yrs; Price per REC: $40.00/MWh; Net-metering Analysis Interval: Monthly; Annual Energy Production: 15,959 kWh',
          ecm_status: 'Identified',
          ecm_scope: 'Measure',
          ecm_date_identified: '2024-03-20',
          savings_entries: [
            {
              fuel_type: 'Electricity',
              energy_savings: {
                value: 15959.0,
                unit: 'kWh',
              },
              cost_savings: {
                value: 12640.0,
                unit: 'USD',
              },
              demand_savings: {
                value: 11.0,
                unit: 'kW',
              },
            },
          ],
          implementation_cost: {
            value: 32452.0,
            unit: 'USD',
          },
          ecm_lifetime: {
            value: 25.0,
            unit: 'year',
          },
          site_eui_at_audit: {
            value: 59.1,
            unit: 'kBtu/sf',
          },
        },
      ];

      dispatch(setEcmResults(mockResults));
      navigate({ to: '/ecm-extractor/results' });
    }, 2000);
  };

  const handleBack = () => {
    navigate({ to: '/ecm-extractor' });
  };

  if (!state.editedMarkdown) {
    navigate({ to: '/ecm-extractor' });
    return null;
  }

  return (
    <Box
      sx={{
        height: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {state.isLoading && <LinearProgress />}

      <Paper
        elevation={1}
        sx={{
          padding: 2,
          borderRadius: 0,
        }}
      >
        <Container maxWidth="xl">
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Stack>
              <Typography variant="h5" component="h1">
                Review and Edit Markdown
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Step 2 of 3 - Edit the extracted content before ECM extraction
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={handleBack}
                disabled={state.isLoading}
              >
                Back
              </Button>
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={handleExtract}
                disabled={state.isLoading}
              >
                Extract ECM Data
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Paper>

      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <Container
          maxWidth="xl"
          sx={{
            height: '100%',
            paddingTop: 2,
            paddingBottom: 2,
          }}
        >
          <Grid container spacing={2} sx={{ height: '100%' }}>
            <Grid item xs={12} md={6} sx={{ height: '100%' }}>
              <Paper
                elevation={2}
                sx={{
                  height: '100%',
                  padding: 2,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Typography variant="h6" component="h2" gutterBottom>
                  Markdown Editor
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ flex: 1, overflow: 'hidden' }}>
                  <MarkdownEditor
                    value={state.editedMarkdown}
                    onChange={handleMarkdownChange}
                  />
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6} sx={{ height: '100%' }}>
              <Stack sx={{ height: '100%' }} spacing={0}>
                <Paper
                  elevation={2}
                  sx={{
                    padding: 2,
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" component="h2">
                    Preview
                  </Typography>
                  <Divider sx={{ mt: 1 }} />
                </Paper>
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                  <MarkdownPreview markdown={state.editedMarkdown} />
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}

export default StagingPage;
