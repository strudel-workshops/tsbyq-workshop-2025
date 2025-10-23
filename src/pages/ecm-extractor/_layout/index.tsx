import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
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

export const Route = createFileRoute('/ecm-extractor/_layout/')({
  component: UploadPage,
});

/**
 * Step 1: Upload PDF page for ECM Extractor
 */
type SortField =
  | 'filename'
  | 'upload_date'
  | 'file_size'
  | 'image_count'
  | 'ecm_count';
type SortOrder = 'asc' | 'desc';

function UploadPage() {
  const { state, dispatch } = useEcmExtractor();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const shouldNavigate = useRef(false);

  // Table sorting state
  const [sortField, setSortField] = useState<SortField>('upload_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pdfToDelete, setPdfToDelete] = useState<{
    id: string;
    filename: string;
  } | null>(null);

  // Upload dialog state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

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
      setDeleteDialogOpen(false);
      setPdfToDelete(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete PDF';
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleDeleteClick = (pdfId: string, filename: string) => {
    setPdfToDelete({ id: pdfId, filename });
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setPdfToDelete(null);
  };

  const handleDeleteConfirm = () => {
    if (pdfToDelete) {
      handleDeletePdf(pdfToDelete.id);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleUploadDialogOpen = () => {
    setUploadDialogOpen(true);
  };

  const handleUploadDialogClose = () => {
    setUploadDialogOpen(false);
    setSelectedFile(null);
    setIsDragging(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Sort PDFs
  const sortedPdfs = [...state.uploadedPdfs].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    // Handle null values for ecm_count
    if (sortField === 'ecm_count') {
      aValue = aValue ?? -1;
      bValue = bValue ?? -1;
    }

    if (typeof aValue === 'string') {
      return sortOrder === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
  });

  return (
    <Container
      maxWidth="md"
      sx={{
        mt: 4,
        mb: 4,
      }}
    >
      <Stack spacing={4}>
        {/* Previously Uploaded PDFs */}
        {state.uploadedPdfs.length > 0 && (
          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              Previously Uploaded PDFs ({state.uploadedPdfs.length})
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={sortField === 'filename'}
                        direction={sortField === 'filename' ? sortOrder : 'asc'}
                        onClick={() => handleSort('filename')}
                      >
                        Filename
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortField === 'upload_date'}
                        direction={
                          sortField === 'upload_date' ? sortOrder : 'asc'
                        }
                        onClick={() => handleSort('upload_date')}
                      >
                        Upload Date
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">
                      <TableSortLabel
                        active={sortField === 'file_size'}
                        direction={
                          sortField === 'file_size' ? sortOrder : 'asc'
                        }
                        onClick={() => handleSort('file_size')}
                      >
                        File Size
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">
                      <TableSortLabel
                        active={sortField === 'image_count'}
                        direction={
                          sortField === 'image_count' ? sortOrder : 'asc'
                        }
                        onClick={() => handleSort('image_count')}
                      >
                        Images
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">
                      <TableSortLabel
                        active={sortField === 'ecm_count'}
                        direction={
                          sortField === 'ecm_count' ? sortOrder : 'asc'
                        }
                        onClick={() => handleSort('ecm_count')}
                      >
                        ECMs
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedPdfs.map((pdf) => (
                    <TableRow
                      key={pdf.id}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <TableCell>{pdf.filename}</TableCell>
                      <TableCell>{formatDate(pdf.upload_date)}</TableCell>
                      <TableCell align="right">
                        {formatFileSize(pdf.file_size)}
                      </TableCell>
                      <TableCell align="right">{pdf.image_count}</TableCell>
                      <TableCell align="right">
                        {pdf.ecm_count !== null ? pdf.ecm_count : 'N/A'}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleViewPdf(pdf.id)}
                          title="View/Edit"
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() =>
                            handleDeleteClick(pdf.id, pdf.filename)
                          }
                          title="Delete"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
        >
          <DialogTitle id="delete-dialog-title">Delete PDF?</DialogTitle>
          <DialogContent>
            <DialogContentText id="delete-dialog-description">
              Are you sure you want to delete "{pdfToDelete?.filename}"? This
              will remove the PDF, all extracted markdown, images, and ECM data.
              This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel}>Cancel</Button>
            <Button onClick={handleDeleteConfirm} color="error" autoFocus>
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* New Upload Button */}
        <Box>
          <Button
            variant="contained"
            size="large"
            startIcon={<CloudUploadIcon />}
            onClick={handleUploadDialogOpen}
            fullWidth
          >
            New Building PDF Upload
          </Button>
        </Box>

        {/* Upload Dialog */}
        <Dialog
          open={uploadDialogOpen}
          onClose={handleUploadDialogClose}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Upload PDF Document</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Alert severity="info">
                Upload a PDF document containing Energy Conservation Measure
                (ECM) information. The system will extract the content as
                markdown for review and editing before extracting structured ECM
                data.
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
                <Alert severity="success">
                  <Typography>
                    <strong>Selected file:</strong> {selectedFile.name}
                  </Typography>
                  <Typography variant="body2">
                    Size: {(selectedFile.size / 1024).toFixed(2)} KB
                  </Typography>
                </Alert>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleUploadDialogClose}>Cancel</Button>
            <Button
              variant="contained"
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
          </DialogActions>
        </Dialog>
      </Stack>
    </Container>
  );
}

export default UploadPage;
