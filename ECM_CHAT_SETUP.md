# ECM Chat Assistant Setup Guide

The ECM Extractor now includes an AI-powered chat assistant that can answer questions about your ECM data using OpenAI's GPT-4.

## Features

- **Natural Language Queries**: Ask questions in plain English about your ECM data
- **Data Analysis**: Get insights on costs, savings, payback periods, and ROI
- **Comparisons**: Compare different ECMs and get recommendations
- **Calculations**: Calculate totals, averages, and other metrics on the fly
- **Context-Aware**: The assistant has access to all your ECM data

## Setup Instructions

### Option A: Using CBORG Backend (Recommended)

1. Copy the `.env.example` file to `.env`:

   ```bash
   cp .env.example .env
   ```

2. The `.env` file is already configured to use the CBORG backend:

   ```
   VITE_CHAT_API_URL=https://api.cborg.lbl.gov
   ```

3. Configure authentication based on your CBORG backend setup (API key or other method)

4. **Important**: Never commit your `.env` file to version control! It's already in `.gitignore`.

### Option B: Using OpenAI Directly

1. Get an OpenAI API Key:

   - Go to [OpenAI Platform](https://platform.openai.com/api-keys)
   - Sign up or log in to your account
   - Navigate to API Keys section
   - Click "Create new secret key"
   - Copy the generated API key (it starts with `sk-`)

2. Copy the `.env.example` file to `.env`:

   ```bash
   cp .env.example .env
   ```

3. Update the `.env` file:

   ```
   # Comment out or change the CBORG URL
   # VITE_CHAT_API_URL=https://api.cborg.lbl.gov

   # Add your OpenAI API key
   VITE_OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

   If `VITE_CHAT_API_URL` is not set, it will default to OpenAI's API.

### 3. Restart the Development Server

After adding your API key, restart the development server:

```bash
npm run dev
```

## Using the Chat Assistant

1. Navigate to the ECM Extractor section
2. Upload and process a PDF
3. On the results page, you'll see the chat assistant in the right side panel
4. Start chatting!

### Example Questions

Try asking questions like:

- "What's the total implementation cost for all ECMs?"
- "Which ECM has the best payback period?"
- "Compare LED Lighting and Solar PV measures"
- "What are the total annual savings?"
- "Explain what ENERGY STAR score means"
- "Which measures have incentives available?"
- "What's the ROI for the VRF system?"
- "Summarize all the ECMs in order of priority"

## Cost Considerations

- OpenAI GPT-4 API charges per token (input + output)
- Each chat message costs approximately $0.01 - $0.03 depending on length
- Consider using GPT-3.5-turbo for lower costs (edit the model in `EcmChatAssistant.tsx`)
- Set usage limits in your OpenAI dashboard to control spending

## Troubleshooting

### "No API key configured" error

- Make sure you created the `.env` file in the project root
- Verify the environment variable name is exactly `VITE_OPENAI_API_KEY`
- Restart the development server after adding the key

### "API error: 401 Unauthorized"

- For OpenAI: Your API key may be invalid or revoked
- For CBORG backend: Check your authentication configuration
- Verify no extra spaces in the API key

### "API error: 429 Too Many Requests"

- You've exceeded API rate limits
- Wait a few moments and try again
- For OpenAI: Check your account usage and limits

### Chat not working with CBORG backend

- Verify `VITE_CHAT_API_URL=https://api.cborg.lbl.gov` is set in `.env`
- Check that the CBORG backend is running and accessible
- Ensure the backend accepts the same request format as OpenAI API
- Check browser console for specific error messages

## Backend Configuration

### CBORG Backend

The chat is configured to use the CBORG backend at `https://api.cborg.lbl.gov`. Your backend should:

1. Accept POST requests with OpenAI-compatible format
2. Handle authentication (API key or other method)
3. Return responses in OpenAI chat completion format
4. Implement rate limiting and security measures

### Changing the Backend URL

To use a different backend, update `.env`:

```bash
VITE_CHAT_API_URL=https://your-backend-url.com/chat
```

The chat component will send requests to this URL instead.

## Security Notes

- **Never** share your API key publicly
- **Never** commit `.env` file to Git
- Using CBORG backend provides better security than direct OpenAI calls
- API credentials are handled server-side in the backend
- Implement rate limiting and authentication in your backend
