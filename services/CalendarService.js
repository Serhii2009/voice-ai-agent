const { google } = require('googleapis')
const { DateTime } = require('luxon')

class CalendarService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'urn:ietf:wg:oauth:2.0:oob'
    )

    this.oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    })

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })
  }

  async getUpcomingEvents() {
    try {
      const now = new Date()
      const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000) // Next 24 hours

      const response = await this.calendar.events.list({
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        timeMin: now.toISOString(),
        timeMax: endTime.toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime',
      })

      const events = response.data.items || []

      console.log(`📅 Found ${events.length} upcoming events`)

      return events.map((event) => ({
        id: event.id,
        summary: event.summary,
        description: event.description,
        start: event.start,
        end: event.end,
        status: event.status,
      }))
    } catch (error) {
      console.error('❌ Error fetching calendar events:', error)
      throw error
    }
  }

  async getEventById(eventId) {
    try {
      const response = await this.calendar.events.get({
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        eventId: eventId,
      })

      return response.data
    } catch (error) {
      console.error('❌ Error fetching event by ID:', error)
      throw error
    }
  }
}

module.exports = CalendarService
