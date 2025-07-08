const express = require('express')
const cron = require('node-cron')
const dotenv = require('dotenv')
const CalendarService = require('./services/CalendarService')
const PhoneCallService = require('./services/PhoneCallService')
const AIService = require('./services/AIService')
const { DateTime } = require('luxon')

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(express.json())

// Initialize services
const calendarService = new CalendarService()
const phoneCallService = new PhoneCallService()
const aiService = new AIService()

// Keep alive function for Render
const keepAlive = () => {
  const url = process.env.APP_URL
  if (url) {
    setInterval(async () => {
      try {
        console.log('🔄 Keep alive ping...')
        const response = await fetch(`${url}/health`)
        console.log('✅ Keep alive successful:', response.status)
      } catch (error) {
        console.error('❌ Keep alive failed:', error.message)
      }
    }, 14 * 60 * 1000) // Every 14 minutes
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// Main workflow function
async function processCalendarEvents() {
  try {
    console.log('🔍 Checking calendar events...')

    // Get upcoming events from Google Calendar
    const events = await calendarService.getUpcomingEvents()

    if (!events || events.length === 0) {
      console.log('📅 No upcoming events found')
      return
    }

    // Process each event
    for (const event of events) {
      if (await shouldProcessEvent(event)) {
        console.log(`📞 Processing event: ${event.summary}`)

        // Extract client information using AI
        const clientInfo = await aiService.extractClientInfo(event)

        if (clientInfo) {
          // Make phone call
          await phoneCallService.makeCall(clientInfo)
          console.log(`✅ Call initiated for ${clientInfo.name}`)
        }
      }
    }
  } catch (error) {
    console.error('❌ Error processing calendar events:', error)
  }
}

// Check if event should be processed (same logic as n8n IF node)
async function shouldProcessEvent(event) {
  if (!event.start || !event.start.dateTime) {
    return false
  }

  const eventStart = DateTime.fromISO(event.start.dateTime)
  const now = DateTime.now()

  // Event should start within next 2 minutes
  const condition1 =
    eventStart.toMillis() <= now.plus({ minutes: 2 }).toMillis()

  // Event should start no earlier than 3 minutes ago
  const condition2 =
    eventStart.toMillis() >= now.minus({ minutes: 3 }).toMillis()

  return condition1 && condition2
}

// Schedule cron job to run every 5 minutes
cron.schedule('*/5 * * * *', () => {
  console.log('⏰ Cron job triggered at:', new Date().toLocaleString())
  processCalendarEvents()
})

// Manual trigger endpoint for testing
app.get('/trigger', async (req, res) => {
  try {
    await processCalendarEvents()
    res.json({ success: true, message: 'Workflow triggered successfully' })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Test endpoint to check specific event
app.get('/test-event', async (req, res) => {
  try {
    const events = await calendarService.getUpcomingEvents()
    const results = []

    for (const event of events) {
      const shouldProcess = await shouldProcessEvent(event)
      results.push({
        event: event.summary,
        startTime: event.start?.dateTime,
        shouldProcess,
        eventStart: event.start?.dateTime
          ? DateTime.fromISO(event.start.dateTime).toLocaleString()
          : null,
        currentTime: DateTime.now().toLocaleString(),
      })
    }

    res.json(results)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📅 Calendar monitoring active - checking every 5 minutes`)

  // Start keep alive if URL is configured
  if (process.env.APP_URL) {
    console.log('💓 Keep alive service started')
    keepAlive()
  }

  // Run initial check
  setTimeout(processCalendarEvents, 5000)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully')
  process.exit(0)
})
