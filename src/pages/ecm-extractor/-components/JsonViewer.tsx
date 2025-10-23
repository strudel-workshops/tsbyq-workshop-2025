import { Button, Paper, Stack, Typography, Box } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { useState } from 'react';

interface JsonViewerProps {
  data: Record<string, unknown>;
}

/**
 * JSON viewer component with syntax highlighting and copy functionality
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
          sx={{
            maxHeight: '600px',
            overflow: 'auto',
            borderRadius: 1,
          }}
        >
          <SyntaxHighlighter
            language="json"
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              borderRadius: '4px',
            }}
          >
            {jsonString}
          </SyntaxHighlighter>
        </Box>
      </Stack>
    </Paper>
  );
};
