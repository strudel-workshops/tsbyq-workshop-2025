import { Box, TextField } from '@mui/material';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Markdown editor component with syntax-friendly text area
 */
export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
}) => {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TextField
        multiline
        fullWidth
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter or edit markdown here..."
        sx={{
          flex: 1,
          '& .MuiInputBase-root': {
            height: '100%',
            alignItems: 'flex-start',
            fontFamily: 'monospace',
            fontSize: '14px',
          },
          '& .MuiInputBase-input': {
            height: '100% !important',
            overflow: 'auto !important',
          },
        }}
        InputProps={{
          sx: {
            height: '100%',
          },
        }}
      />
    </Box>
  );
};
