import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ImageIcon from '@mui/icons-material/Image';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useState } from 'react';
import { PdfMetadata } from '../-context/actions';

interface PdfListCardProps {
  pdf: PdfMetadata;
  onView: (pdfId: string) => void;
  onDelete: (pdfId: string) => void;
}

export const PdfListCard: React.FC<PdfListCardProps> = ({
  pdf,
  onView,
  onDelete,
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    onDelete(pdf.id);
    setDeleteDialogOpen(false);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <>
      <Card
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          '&:hover': {
            boxShadow: 4,
          },
        }}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Box display="flex" alignItems="flex-start" gap={1} mb={1}>
            <DescriptionIcon color="primary" />
            <Box flexGrow={1}>
              <Typography variant="h6" component="h3" gutterBottom>
                {pdf.filename}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Uploaded: {formatDate(pdf.upload_date)}
              </Typography>
            </Box>
          </Box>

          <Box display="flex" gap={1} flexWrap="wrap">
            <Chip
              icon={<ImageIcon />}
              label={`${pdf.image_count} ${pdf.image_count === 1 ? 'image' : 'images'}`}
              size="small"
              variant="outlined"
            />
            {pdf.has_ecm_data && (
              <Chip
                icon={<CheckCircleIcon />}
                label="ECM Data"
                size="small"
                color="success"
                variant="outlined"
              />
            )}
          </Box>
        </CardContent>

        <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
          <Button
            size="small"
            startIcon={<VisibilityIcon />}
            onClick={() => onView(pdf.id)}
          >
            View/Edit
          </Button>
          <Button
            size="small"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteClick}
          >
            Delete
          </Button>
        </CardActions>
      </Card>

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
            Are you sure you want to delete "{pdf.filename}"? This will remove
            the PDF, all extracted markdown, images, and ECM data. This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
