# Voice AI Scheduler

Automated voice AI scheduler that monitors Google Calendar events and makes phone calls using Retell AI.

## Features

- 🕐 **Automated Scheduling**: Monitors Google Calendar every 5 minutes
- 📞 **Smart Phone Calls**: Automatically calls clients based on calendar events
- 🤖 **AI-Powered**: Uses OpenRouter AI to extract client information
- 💓 **Keep Alive**: Prevents Render free tier from sleeping
- 🔄 **Error Handling**: Robust error handling and fallback mechanisms

## Setup

### 1. Environment Variables

Create a `.env` file with the following variables:

```env
# Google Calendar API
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_google_refresh_token
GOOGLE_CALENDAR_ID=your_calendar_id

# OpenRouter API
OPENROUTER_API_KEY=your_openrouter_api_key

# Retell AI API
RETELL_API_KEY=your_retell_api_key
RETELL_AGENT_ID=your_retell_agent_id
FROM_PHONE_NUMBER=your_from_phone_number

# Server configuration
PORT=3000
APP_URL=https://your-app-name.onrender.com
```

### 2. Google Calendar Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Get refresh token using OAuth playground

### 3. OpenRouter Setup

1. Sign up at [OpenRouter](https://openrouter.ai/)
2. Get your API key
3. Add it to environment variables

### 4. Retell AI Setup

1. Sign up at [Retell AI](https://retellai.com/)
2. Create an agent
3. Get your API key and agent ID

## Calendar Event Format

Your calendar events should have descriptions in this format:

```
Client: John Doe
Phone: +1234567890
Meeting Purpose: Demo of AI Telegram bot capabilities
```

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd voice-ai-scheduler

# Install dependencies
npm install

# Start the application
npm start
```

## API Endpoints

- `GET /health` - Health check
- `GET /trigger` - Manually trigger the workflow
- `GET /test-event` - Test event processing logic

## Deployment on Render

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set environment variables in Render dashboard
4. Deploy

The `render.yaml` file contains the deployment configuration.

## How It Works

1. **Cron Job**: Runs every 5 minutes
2. **Calendar Check**: Fetches upcoming events from Google Calendar
3. **Event Filter**: Checks if events are starting within 2 minutes (but not more than 3 minutes ago)
4. **AI Processing**: Extracts client information using OpenRouter AI
5. **Phone Call**: Makes automated call using Retell AI
6. **Keep Alive**: Sends ping every 14 minutes to prevent sleeping

## Logging

The application provides detailed logging:

- 🔍 Calendar event checking
- 📞 Phone call initiation
- 🤖 AI processing results
- 💓 Keep alive status
- ❌ Error handling

## Error Handling

- Fallback client information extraction if AI fails
- Graceful error handling for API failures
- Automatic retry mechanisms where appropriate

## Development

```bash
# Run in development mode with auto-reload
npm run dev
```

## License

MIT License
