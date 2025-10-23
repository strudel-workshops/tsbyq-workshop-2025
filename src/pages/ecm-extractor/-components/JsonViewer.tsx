import { Button, Paper, Stack, Typography, Box } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useState } from 'react';

interface JsonViewerProps {
  data: unknown;
}

/**
 * JSON viewer component with copy functionality
 */
export const JsonViewer: React.FC<JsonViewerProps> = ({ data }) => {
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Paper
      sx={{
        padding: 3,
      }}
    >
      <Stack spacing={2}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h6" component="h3">
            Extracted ECM Data
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ContentCopyIcon />}
            onClick={handleCopy}
          >
            {copied ? 'Copied!' : 'Copy JSON'}
          </Button>
        </Stack>
        <Box
          component="pre"
          sx={{
            maxHeight: '600px',
            overflow: 'auto',
            borderRadius: 1,
            backgroundColor: '#1e1e1e',
            color: '#d4d4d4',
            padding: 2,
            margin: 0,
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            lineHeight: 1.5,
          }}
        >
          <code>{jsonString}</code>
        </Box>
      </Stack>
    </Paper>
  );
};
