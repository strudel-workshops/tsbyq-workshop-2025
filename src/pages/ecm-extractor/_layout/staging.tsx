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
import { useEffect } from 'react';
import { useEcmExtractor } from '../-context/ContextProvider';
import {
  setEditedMarkdown,
  setEcmResults,
  setLoading,
  setError,
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

  const handleExtract = async () => {
    dispatch(setLoading(true));

    try {
      const response = await fetch('http://localhost:8000/api/extract-ecm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markdown: state.editedMarkdown,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || 'Failed to extract ECM data from markdown'
        );
      }

      const data = await response.json();

      // Structure the results in the expected format
      const results = {
        documentInfo: {
          fileName: state.fileName,
          processedDate: new Date().toISOString(),
          totalMeasures: data.record_count,
        },
        records: data.records,
        recordCount: data.record_count,
      };

      dispatch(setEcmResults(results));
      navigate({ to: '/ecm-extractor/results' });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to extract ECM data';
      dispatch(setError(errorMessage));
      alert(
        `Error: ${errorMessage}\n\nPlease make sure:\n1. The backend server is running on http://localhost:8000\n2. Your CBORG_API_KEY is set in the backend/.env file`
      );
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleBack = () => {
    navigate({ to: '/ecm-extractor' });
  };

  // Redirect if no markdown is available - use useEffect to avoid setState during render
  useEffect(() => {
    if (!state.editedMarkdown) {
      navigate({ to: '/ecm-extractor' });
    }
  }, [state.editedMarkdown, navigate]);

  if (!state.editedMarkdown) {
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
              <Paper
                elevation={2}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ padding: 2 }}>
                  <Typography variant="h6" component="h2">
                    Preview
                  </Typography>
                  <Divider sx={{ mt: 1 }} />
                </Box>
                <Box sx={{ flex: 1, overflow: 'auto', padding: 2 }}>
                  <MarkdownPreview
                    markdown={state.editedMarkdown}
                    images={state.images}
                  />
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}

export default StagingPage;
