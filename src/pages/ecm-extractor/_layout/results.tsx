import {
  Button,
  Container,
  Stack,
  Typography,
  Alert,
  Paper,
  Grid,
  Chip,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useEcmExtractor } from '../-context/ContextProvider';
import { resetState } from '../-context/actions';
import { JsonViewer } from '../-components/JsonViewer';

export const Route = createFileRoute('/ecm-extractor/_layout/results')({
  component: ResultsPage,
});

/**
 * Step 3: Results page with JSON viewer and download options
 */
function ResultsPage() {
  const { state, dispatch } = useEcmExtractor();
  const navigate = useNavigate();

  const handleDownloadJson = () => {
    if (state.ecmResults) {
      const dataStr = JSON.stringify(state.ecmResults, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ecm-results-${state.fileName.replace('.pdf', '')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleBackToEdit = () => {
    navigate({ to: '/ecm-extractor/staging' });
  };

  const handleNewExtraction = () => {
    dispatch(resetState());
    navigate({ to: '/ecm-extractor' });
  };

  // Redirect if no results are available - use useEffect to avoid setState during render
  useEffect(() => {
    if (!state.ecmResults) {
      navigate({ to: '/ecm-extractor' });
    }
  }, [state.ecmResults, navigate]);

  if (!state.ecmResults) {
    return null;
  }

  // Extract summary information if available
  const results = state.ecmResults as {
    documentInfo?: { totalMeasures?: number; processedDate?: string };
    summary?: {
      totalEstimatedSavings?: string;
      paybackPeriod?: string;
    };
  };

  return (
    <Container
      maxWidth="xl"
      sx={{
        mt: 3,
        mb: 3,
      }}
    >
      <Stack spacing={3}>
        <Paper
          elevation={1}
          sx={{
            padding: 2,
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Stack>
              <Typography variant="h4" component="h1">
                Extraction Results
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Step 3 of 3 - Review extracted ECM data
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleBackToEdit}
              >
                Back to Edit
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadJson}
              >
                Download JSON
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleNewExtraction}
              >
                New Extraction
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Alert severity="success">
          Successfully extracted ECM data from <strong>{state.fileName}</strong>
        </Alert>

        {results.documentInfo && (
          <Paper
            elevation={2}
            sx={{
              padding: 3,
            }}
          >
            <Typography variant="h6" component="h2" gutterBottom>
              Summary Statistics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  elevation={0}
                  sx={{
                    padding: 2,
                    backgroundColor: 'primary.50',
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="h4" color="primary.main">
                    {results.documentInfo.totalMeasures || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total ECMs Found
                  </Typography>
                </Paper>
              </Grid>
              {results.summary?.totalEstimatedSavings && (
                <Grid item xs={12} sm={6} md={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      padding: 2,
                      backgroundColor: 'success.50',
                      textAlign: 'center',
                    }}
                  >
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      color="success.main"
                    >
                      {results.summary.totalEstimatedSavings}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Estimated Savings
                    </Typography>
                  </Paper>
                </Grid>
              )}
              {results.summary?.paybackPeriod && (
                <Grid item xs={12} sm={6} md={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      padding: 2,
                      backgroundColor: 'info.50',
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="h6" color="info.main">
                      {results.summary.paybackPeriod}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Payback Period
                    </Typography>
                  </Paper>
                </Grid>
              )}
              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  elevation={0}
                  sx={{
                    padding: 2,
                    backgroundColor: 'grey.100',
                    textAlign: 'center',
                  }}
                >
                  <Chip
                    label="JSON"
                    color="primary"
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Export Format
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        )}

        <JsonViewer data={state.ecmResults} />
      </Stack>
    </Container>
  );
}

export default ResultsPage;
