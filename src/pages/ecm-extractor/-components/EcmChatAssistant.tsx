import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Stack,
  CircularProgress,
  Alert,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import OpenAI from 'openai';
import { EcmData } from '../-types/ecm.types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface EcmChatAssistantProps {
  ecmData: EcmData[];
  apiKey?: string;
}

/**
 * Chat Assistant Component
 * Provides an AI-powered chat interface for querying ECM data
 */
export const EcmChatAssistant: React.FC<EcmChatAssistantProps> = ({
  ecmData,
  apiKey,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hello! I'm your ECM Data Assistant. I can help you analyze the Energy Conservation Measures data. Ask me anything about the ECMs, costs, savings, or recommendations!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    if (!apiKey) {
      setError(
        'Please set your OpenAI API key in the environment variable VITE_OPENAI_API_KEY'
      );
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Prepare context for the AI
      const systemPrompt = `You are an expert energy analyst assistant helping users understand Energy Conservation Measure (ECM) data. 

Here is the ECM data you're analyzing:
${JSON.stringify(ecmData, null, 2)}

Your role:
- Answer questions about specific ECMs, their costs, savings, and payback periods
- Compare different measures and provide recommendations
- Explain technical terms in simple language
- Calculate totals, averages, and ROI when asked
- Provide insights on energy efficiency and cost-effectiveness

Be concise but informative. Use specific numbers from the data when relevant.`;

      // Initialize OpenAI client with CBORG base URL
      const baseUrl =
        import.meta.env.VITE_CHAT_API_URL || 'https://api.openai.com/v1';
      const client = new OpenAI({
        apiKey: apiKey,
        baseURL: baseUrl,
        dangerouslyAllowBrowser: true, // Required for browser usage
      });

      // Use OpenAI SDK to call the chat completion API
      const response = await client.chat.completions.create({
        model: 'openai/gpt-4o', // CBORG model format
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
          { role: 'user', content: input },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.choices[0].message.content || 'No response',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to get response from AI'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <SmartToyIcon color="primary" />
          <Typography variant="h6">ECM Assistant</Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Ask questions about your ECM data
        </Typography>
      </Box>

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          backgroundColor: 'grey.50',
        }}
      >
        <Stack spacing={2}>
          {messages.map((message, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent:
                  message.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  maxWidth: '80%',
                  backgroundColor:
                    message.role === 'user'
                      ? 'primary.main'
                      : 'background.paper',
                  color: message.role === 'user' ? 'white' : 'text.primary',
                }}
              >
                <Stack direction="row" spacing={1} alignItems="start">
                  {message.role === 'assistant' && (
                    <SmartToyIcon sx={{ fontSize: 20, mt: 0.5 }} />
                  )}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {message.content}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mt: 1,
                        opacity: 0.7,
                      }}
                    >
                      {message.timestamp.toLocaleTimeString()}
                    </Typography>
                  </Box>
                  {message.role === 'user' && (
                    <PersonIcon sx={{ fontSize: 20, mt: 0.5 }} />
                  )}
                </Stack>
              </Paper>
            </Box>
          ))}
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={16} />
                  <Typography variant="body2">Thinking...</Typography>
                </Stack>
              </Paper>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Stack>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ m: 2 }}>
          {error}
        </Alert>
      )}

      {/* Input */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth
            multiline
            maxRows={3}
            placeholder="Ask about ECM data..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            size="small"
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
          >
            <SendIcon />
          </IconButton>
        </Stack>
        {!apiKey && (
          <Typography
            variant="caption"
            color="error"
            sx={{ mt: 1, display: 'block' }}
          >
            No API key configured. Set VITE_OPENAI_API_KEY environment variable.
          </Typography>
        )}
      </Box>
    </Paper>
  );
};
