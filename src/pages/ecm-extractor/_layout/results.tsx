import {
  Button,
  Stack,
  Typography,
  Alert,
  Paper,
  Tabs,
  Tab,
  Box,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useEcmExtractor } from '../-context/ContextProvider';
import { resetState } from '../-context/actions';
import { JsonViewer } from '../-components/JsonViewer';
import { BuildingInfoSummary } from '../-components/BuildingInfoSummary';
import { EcmOverviewDashboard } from '../-components/EcmOverviewDashboard';
import { EcmComparisonTable } from '../-components/EcmComparisonTable';
import { EcmCharts } from '../-components/EcmCharts';
import { EcmDetailCards } from '../-components/EcmDetailCards';
import { AuditContext } from '../-components/AuditContext';
import { EcmChatAssistant } from '../-components/EcmChatAssistant';
import { EcmData } from '../-types/ecm.types';
import {
  extractBuildingInfo,
  transformToTableRows,
  calculateEcmSummary,
} from '../-utils/ecm.utils';

export const Route = createFileRoute('/ecm-extractor/_layout/results')({
  component: ResultsPage,
});

/**
 * Step 3: Results page with comprehensive ECM data visualization
 */
function ResultsPage() {
  const { state, dispatch } = useEcmExtractor();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

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

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Navigate away if no results (wrapped in useEffect to avoid render-time navigation)
  useEffect(() => {
    if (!state.ecmResults) {
      navigate({ to: '/ecm-extractor' });
    }
  }, [state.ecmResults, navigate]);

  if (!state.ecmResults) {
    return null;
  }

  // Parse ECM data
  const ecmDataArray = Array.isArray(state.ecmResults)
    ? (state.ecmResults as EcmData[])
    : [];

  // Extract information
  const buildingInfo = extractBuildingInfo(ecmDataArray);
  const ecmSummary = calculateEcmSummary(ecmDataArray);
  const ecmTableRows = transformToTableRows(ecmDataArray);

  return (
    <Box
      sx={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}
    >
      {/* Main Content Area */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
        <Stack spacing={3}>
          {/* Header */}
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

          {/* Success Alert */}
          <Alert severity="success">
            Successfully extracted {ecmDataArray.length} ECM
            {ecmDataArray.length !== 1 ? 's' : ''} from{' '}
            <strong>{state.fileName}</strong>
          </Alert>

          {/* Building Information */}
          {buildingInfo && <BuildingInfoSummary buildingInfo={buildingInfo} />}

          {/* Audit Context */}
          <AuditContext ecmData={ecmDataArray} />

          {/* ECM Overview Dashboard */}
          <EcmOverviewDashboard summary={ecmSummary} />

          {/* Tabs for different views */}
          <Paper elevation={2}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="ECM data views"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Table View" />
              <Tab label="Charts" />
              <Tab label="Detailed View" />
              <Tab label="Raw JSON" />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {/* Table View */}
              {tabValue === 0 && <EcmComparisonTable ecms={ecmTableRows} />}

              {/* Charts View */}
              {tabValue === 1 && <EcmCharts ecms={ecmTableRows} />}

              {/* Detailed View */}
              {tabValue === 2 && <EcmDetailCards ecms={ecmTableRows} />}

              {/* Raw JSON View */}
              {tabValue === 3 && <JsonViewer data={state.ecmResults} />}
            </Box>
          </Paper>
        </Stack>
      </Box>

      {/* Chat Assistant Side Panel */}
      <Box
        sx={{
          width: 400,
          borderLeft: 1,
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'background.paper',
        }}
      >
        <EcmChatAssistant ecmData={ecmDataArray} />
      </Box>
    </Box>
  );
}

export default ResultsPage;
