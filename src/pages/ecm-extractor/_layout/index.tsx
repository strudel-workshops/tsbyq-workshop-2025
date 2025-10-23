import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
  Alert,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useEcmExtractor } from '../-context/ContextProvider';
import { setUploadedFile, setExtractedMarkdown } from '../-context/actions';

export const Route = createFileRoute('/ecm-extractor/_layout/')({
  component: UploadPage,
});

/**
 * Step 1: Upload PDF page for ECM Extractor
 */
function UploadPage() {
  const { dispatch } = useEcmExtractor();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (file: File) => {
    if (file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      alert('Please select a PDF file');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUploadAndProcess = () => {
    if (selectedFile) {
      dispatch(setUploadedFile(selectedFile));

      // Simulate markdown extraction - you'll replace this with actual extraction logic
      const mockMarkdown = `# Sample Extracted Content from ${selectedFile.name}

## Energy Conservation Measures

### Measure 1: LED Lighting Upgrade
- **Type**: Lighting
- **Description**: Replace existing fluorescent lighting with LED fixtures
- **Energy Savings**: 40-60%
- **Cost**: $5,000 - $8,000

### Measure 2: HVAC System Optimization
- **Type**: HVAC
- **Description**: Install programmable thermostats and optimize schedule
- **Energy Savings**: 20-30%
- **Cost**: $2,000 - $4,000

## Summary
Total estimated savings: 25-35% reduction in energy costs
Total estimated cost: $7,000 - $12,000
Payback period: 2-3 years`;

      dispatch(setExtractedMarkdown(mockMarkdown));
      navigate({ to: '/ecm-extractor/staging' });
    }
  };

  return (
    <Container
      maxWidth="md"
      sx={{
        mt: 4,
        mb: 4,
      }}
    >
      <Paper
        sx={{
          padding: 4,
        }}
      >
        <Stack spacing={4}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              ECM Extractor
            </Typography>
            <Typography variant="h6" component="h2" color="text.secondary">
              Upload PDF Document
            </Typography>
          </Box>

          <Alert severity="info">
            Upload a PDF document containing Energy Conservation Measure (ECM)
            information. The system will extract the content as markdown for
            review and editing before extracting structured ECM data.
          </Alert>

          <Box>
            <Typography fontWeight="medium" mb={2}>
              Select PDF File
            </Typography>
            <Paper
              elevation={0}
              sx={{
                border: '2px dashed',
                borderColor: isDragging ? 'primary.main' : 'grey.400',
                backgroundColor: isDragging ? 'primary.50' : 'grey.50',
                padding: 4,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'primary.50',
                },
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <Stack spacing={2} alignItems="center">
                <CloudUploadIcon
                  sx={{ fontSize: 60, color: 'primary.main', opacity: 0.7 }}
                />
                <Typography variant="body1">
                  Drag and drop your PDF file here, or click to browse
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Only PDF files are accepted
                </Typography>
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf,application/pdf"
                  style={{ display: 'none' }}
                  onChange={handleFileInput}
                />
              </Stack>
            </Paper>
          </Box>

          {selectedFile && (
            <Box>
              <Alert severity="success">
                <Typography>
                  <strong>Selected file:</strong> {selectedFile.name}
                </Typography>
                <Typography variant="body2">
                  Size: {(selectedFile.size / 1024).toFixed(2)} KB
                </Typography>
              </Alert>
            </Box>
          )}

          <Box textAlign="right">
            <Button
              variant="contained"
              size="large"
              disabled={!selectedFile}
              onClick={handleUploadAndProcess}
              startIcon={<CloudUploadIcon />}
            >
              Upload and Process
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}

export default UploadPage;
