import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ImageIcon from '@mui/icons-material/Image';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StorageIcon from '@mui/icons-material/Storage';
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
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
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

  return (
    <>
      <Card
        sx={{
          '&:hover': {
            boxShadow: 4,
          },
        }}
      >
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            {/* Icon */}
            <DescriptionIcon color="primary" sx={{ fontSize: 40 }} />

            {/* Main content */}
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="h6" component="h3" noWrap sx={{ mb: 1 }}>
                {pdf.filename}
              </Typography>

              {/* Stats row */}
              <Stack
                direction="row"
                spacing={2}
                flexWrap="wrap"
                sx={{ gap: 1 }}
              >
                <Chip
                  icon={<AccessTimeIcon />}
                  label={formatDate(pdf.upload_date)}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  icon={<StorageIcon />}
                  label={formatFileSize(pdf.file_size)}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  icon={<ImageIcon />}
                  label={`${pdf.image_count} ${pdf.image_count === 1 ? 'image' : 'images'}`}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  icon={<AssessmentIcon />}
                  label={
                    pdf.ecm_count !== null
                      ? `${pdf.ecm_count} ${pdf.ecm_count === 1 ? 'ECM' : 'ECMs'}`
                      : 'ECMs: N/A'
                  }
                  size="small"
                  variant="outlined"
                  color={pdf.ecm_count !== null ? 'success' : 'default'}
                />
              </Stack>
            </Box>

            {/* Action buttons */}
            <CardActions sx={{ p: 0 }}>
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
          </Stack>
        </CardContent>
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
