import { Box, Paper } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface MarkdownPreviewProps {
  markdown: string;
}

/**
 * Markdown preview component with syntax highlighting for code blocks
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
      <Box>
        <ReactMarkdown
          components={{
            code({ node, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              const inline = !match;
              return !inline && match ? (
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code
                  className={className}
                  style={{
                    backgroundColor: '#f5f5f5',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontFamily: 'monospace',
                  }}
                  {...props}
                >
                  {children}
                </code>
              );
            },
          }}
        >
          {markdown}
        </ReactMarkdown>
      </Box>
    </Paper>
  );
};
