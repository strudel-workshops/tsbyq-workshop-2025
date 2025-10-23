import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Divider,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';
import { useEcmExtractor } from '../-context/ContextProvider';
import {
  setUploadedFile,
  setMarkdownAndImages,
  setLoading,
  setError,
  setUploadedPdfsList,
  loadPdfData,
  deletePdfFromList,
} from '../-context/actions';
import { PdfListCard } from '../-components/PdfListCard';

export const Route = createFileRoute('/ecm-extractor/_layout/')({
  component: UploadPage,
});

/**
 * Step 1: Upload PDF page for ECM Extractor
 */
function UploadPage() {
  const { state, dispatch } = useEcmExtractor();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const shouldNavigate = useRef(false);

  // Fetch list of uploaded PDFs on mount
  useEffect(() => {
    const fetchPdfs = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/pdfs');
        if (response.ok) {
          const data = await response.json();
          dispatch(setUploadedPdfsList(data.pdfs));
        }
      } catch {
        // Silently fail if backend is not available
        // PDF list will be empty until backend is running
      }
    };

    fetchPdfs();
  }, [dispatch]);

  // Navigate to staging page once markdown is loaded
  useEffect(() => {
    if (shouldNavigate.current && state.extractedMarkdown) {
      shouldNavigate.current = false;
      navigate({ to: '/ecm-extractor/staging' });
    }
  }, [state.extractedMarkdown, navigate]);

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

  const handleUploadAndProcess = async () => {
    if (!selectedFile) {
      return;
    }

    dispatch(setUploadedFile(selectedFile));
    dispatch(setLoading(true));

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Call backend API to extract markdown and images
      const response = await fetch(
        'http://localhost:8000/api/extract-markdown',
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || 'Failed to extract markdown from PDF'
        );
      }

      const data = await response.json();

      // Update state with markdown and images
      dispatch(setMarkdownAndImages(data.markdown, data.images, data.pdf_id));

      // Refresh PDF list
      const listResponse = await fetch('http://localhost:8000/api/pdfs');
      if (listResponse.ok) {
        const listData = await listResponse.json();
        dispatch(setUploadedPdfsList(listData.pdfs));
      }

      // Set flag to navigate once state is updated
      shouldNavigate.current = true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to process PDF';
      dispatch(setError(errorMessage));
      alert(
        `Error: ${errorMessage}\n\nPlease make sure the backend server is running on http://localhost:8000`
      );
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleViewPdf = async (pdfId: string) => {
    dispatch(setLoading(true));
    try {
      const response = await fetch(
        `http://localhost:8000/api/pdfs/${encodeURIComponent(pdfId)}`
      );

      if (!response.ok) {
        throw new Error('Failed to load PDF data');
      }

      const data = await response.json();

      // Load PDF data into state
      dispatch(
        loadPdfData(data.id, data.markdown, data.images, data.ecm_results)
      );

      // Navigate to staging or results depending on whether ECM data exists
      if (data.ecm_results) {
        navigate({ to: '/ecm-extractor/results' });
      } else {
        navigate({ to: '/ecm-extractor/staging' });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load PDF';
      dispatch(setError(errorMessage));
      alert(`Error: ${errorMessage}`);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleDeletePdf = async (pdfId: string) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/pdfs/${encodeURIComponent(pdfId)}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete PDF');
      }

      // Remove from state
      dispatch(deletePdfFromList(pdfId));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete PDF';
      alert(`Error: ${errorMessage}`);
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
              disabled={!selectedFile || state.isLoading}
              onClick={handleUploadAndProcess}
              startIcon={
                state.isLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <CloudUploadIcon />
                )
              }
            >
              {state.isLoading ? 'Processing...' : 'Upload and Process'}
            </Button>
          </Box>
        </Stack>
      </Paper>

      {/* Previously Uploaded PDFs */}
      {state.uploadedPdfs.length > 0 && (
        <Box mt={4}>
          <Typography variant="h5" component="h2" gutterBottom>
            Previously Uploaded PDFs ({state.uploadedPdfs.length})
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Grid container spacing={2}>
            {state.uploadedPdfs.map((pdf) => (
              <Grid item xs={12} sm={6} md={4} key={pdf.id}>
                <PdfListCard
                  pdf={pdf}
                  onView={handleViewPdf}
                  onDelete={handleDeletePdf}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Container>
  );
}

export default UploadPage;
