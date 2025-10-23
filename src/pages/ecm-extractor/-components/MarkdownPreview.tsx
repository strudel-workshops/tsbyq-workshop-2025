import { Box, Paper } from '@mui/material';
import ReactMarkdown from 'react-markdown';

interface ImageData {
  id: string;
  page: number;
  format: string;
  filename: string;
  url: string;
  path: string;
}

interface MarkdownPreviewProps {
  markdown: string;
  images?: ImageData[];
}

/**
 * Markdown preview component with styling
 * Images are now embedded directly in markdown with full URLs
 */
export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  markdown,
}) => {
  return (
    <Paper
      sx={{
        height: '100%',
        overflow: 'auto',
        padding: 3,
      }}
    >
      <Box
        sx={{
          '& h1': { fontSize: '2em', fontWeight: 'bold', marginBottom: 2 },
          '& h2': {
            fontSize: '1.5em',
            fontWeight: 'bold',
            marginBottom: 1.5,
            marginTop: 2,
          },
          '& h3': {
            fontSize: '1.25em',
            fontWeight: 'bold',
            marginBottom: 1,
            marginTop: 1.5,
          },
          '& p': { marginBottom: 1 },
          '& ul, & ol': { marginLeft: 3, marginBottom: 1 },
          '& li': { marginBottom: 0.5 },
          '& code': {
            backgroundColor: '#f5f5f5',
            padding: '2px 6px',
            borderRadius: '3px',
            fontFamily: 'monospace',
            fontSize: '0.9em',
          },
          '& pre': {
            backgroundColor: '#1e1e1e',
            color: '#d4d4d4',
            padding: 2,
            borderRadius: 1,
            overflow: 'auto',
            marginBottom: 2,
            '& code': {
              backgroundColor: 'transparent',
              padding: 0,
              color: 'inherit',
            },
          },
          '& img': {
            maxWidth: '100%',
            height: 'auto',
            marginTop: 2,
            marginBottom: 2,
            border: '1px solid #ddd',
            borderRadius: 1,
          },
        }}
      >
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </Box>
    </Paper>
  );
};
