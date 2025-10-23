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

    // Mock extraction - you'll replace this with actual API call
    setTimeout(() => {
      const mockResults = {
        documentInfo: {
          fileName: state.fileName,
          processedDate: new Date().toISOString(),
          totalMeasures: 2,
        },
        measures: [
          {
            id: 'ecm-001',
            name: 'LED Lighting Upgrade',
            category: 'Lighting',
            description:
              'Replace existing fluorescent lighting with LED fixtures',
            energySavings: {
              percentage: '40-60%',
              estimated: '15,000 kWh/year',
            },
            cost: {
              min: 5000,
              max: 8000,
              currency: 'USD',
            },
            implementation: {
              difficulty: 'Medium',
              timeframe: '2-4 weeks',
            },
          },
          {
            id: 'ecm-002',
            name: 'HVAC System Optimization',
            category: 'HVAC',
            description:
              'Install programmable thermostats and optimize schedule',
            energySavings: {
              percentage: '20-30%',
              estimated: '10,000 kWh/year',
            },
            cost: {
              min: 2000,
              max: 4000,
              currency: 'USD',
            },
            implementation: {
              difficulty: 'Low',
              timeframe: '1-2 weeks',
            },
          },
        ],
        summary: {
          totalEstimatedSavings: '25-35% reduction in energy costs',
          totalEstimatedCost: {
            min: 7000,
            max: 12000,
            currency: 'USD',
          },
          paybackPeriod: '2-3 years',
        },
      };

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
