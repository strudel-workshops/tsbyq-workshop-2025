import { Box, Paper } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import { useMemo } from 'react';

interface ImageData {
  id: string;
  page: number;
  format: string;
  data: string;
}

interface MarkdownPreviewProps {
  markdown: string;
  images?: ImageData[];
}

/**
 * Markdown preview component with image replacement and styling
 */
export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  markdown,
  images = [],
}) => {
  // Replace image IDs with actual base64 data URIs
  const processedMarkdown = useMemo(() => {
    let processed = markdown;

    // Create a map of image IDs to data URIs
    const imageMap = new Map<string, string>();
    images.forEach((img) => {
      imageMap.set(img.id, img.data);
    });

    // Replace image references: ![alt](img_id) -> ![alt](data:image/...)
    imageMap.forEach((dataUri, imgId) => {
      // Match markdown image syntax with the image ID
      const regex = new RegExp(`!\\[([^\\]]*)\\]\\(${imgId}\\)`, 'g');
      processed = processed.replace(regex, `![$1](${dataUri})`);
    });

    return processed;
  }, [markdown, images]);

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
        <ReactMarkdown>{processedMarkdown}</ReactMarkdown>
      </Box>
    </Paper>
  );
};
