const axios = require('axios')

class AIService {
  constructor() {
    this.openRouterApiKey = process.env.OPENROUTER_API_KEY
    this.apiUrl = 'https://openrouter.ai/api/v1/chat/completions'
  }

  async extractClientInfo(event) {
    try {
      const prompt = `You are calling a client on behalf of the company to discuss the topic from the calendar event.

Here are the event details:
- Event Title: ${event.summary}
- Start Time: ${event.start.dateTime} (Kyiv time)
- Duration: 1 hour
- Description: ${event.description}

Extract the following from the description:
- Client Name
- Phone Number
- Meeting Purpose

Behave as a professional, friendly AI voice agent. Begin the call with a polite greeting using the client's name. Clearly explain the purpose of the call as described in the calendar. 

You should be able to answer common questions like:
- What can this Telegram bot do?
- How does it work?
- How much does it cost?
- How is it different from a human assistant?

Ask if the client wants to see a demo. Offer to send additional materials via email or Telegram.

At the end, thank the client warmly for their time.

Keep the tone natural, professional, and helpful.

Please extract the client information and return it in the following JSON format:
{
  "name": "client name",
  "phone_number": "phone number",
  "reason": "meeting purpose",
  "start_time": "${event.start.dateTime}",
  "end_time": "${event.end.dateTime}"
}`

      const response = await axios.post(
        this.apiUrl,
        {
          model: 'openai/gpt-4-turbo',
          messages: [
            {
              role: 'system',
              content:
                "You are a professional AI voice assistant working for a tech company that provides AI-powered automation tools. Your main task is to make scheduled phone calls to clients based on calendar events. Each event contains the client's name, meeting purpose, and phone number. You must: - Greet the client politely by name. - Clearly explain the purpose of the call, based on the calendar description. - Answer questions about the AI Telegram bot, its capabilities, and how it helps businesses automate communication. - Provide practical examples of how the bot interacts with clients, presents services, answers FAQs, and helps increase sales — all without human involvement. - If asked, mention that this bot is easy to integrate, works 24/7, and requires no manual input once configured. You must sound confident, friendly, and helpful, like a real customer success manager who knows the product well. If the client is interested, offer to: - Send more information via email or Telegram. - Schedule a live demo or follow-up call. - Guide them through the first steps of setup. Always end the call with appreciation and warmth, thanking the client for their time and interest. Do not invent random facts — rely only on the information in the calendar description or client's questions. If you are unsure, politely offer to follow up via email.",
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        },
        {
          headers: {
            Authorization: `Bearer ${this.openRouterApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      )

      const aiResponse = response.data.choices[0].message.content

      // Try to extract JSON from the response
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const extractedData = JSON.parse(jsonMatch[0])
          console.log('🤖 AI extracted client info:', extractedData)
          return extractedData
        }
      } catch (parseError) {
        console.error('❌ Error parsing AI response:', parseError)
      }

      // Fallback: manual extraction from description
      return this.fallbackExtraction(event)
    } catch (error) {
      console.error('❌ Error calling AI service:', error)
      // Fallback to manual extraction
      return this.fallbackExtraction(event)
    }
  }

  fallbackExtraction(event) {
    const description = event.description || ''
    const lines = description.split('\n')

    let name = ''
    let phoneNumber = ''
    let reason = ''

    lines.forEach((line) => {
      const lowerLine = line.toLowerCase()
      if (lowerLine.includes('client:')) {
        name = line.split(':')[1]?.trim() || ''
      } else if (lowerLine.includes('phone:')) {
        phoneNumber = line.split(':')[1]?.trim() || ''
      } else if (
        lowerLine.includes('meeting purpose:') ||
        lowerLine.includes('purpose:')
      ) {
        reason = line.split(':')[1]?.trim() || ''
      }
    })

    // If reason is empty, try to extract from longer description
    if (!reason && description.includes('The purpose of this meeting')) {
      const purposeMatch = description.match(
        /The purpose of this meeting is to (.+?)(?:\.|$)/
      )
      if (purposeMatch) {
        reason = purposeMatch[1].trim()
      }
    }

    console.log('🔧 Fallback extraction result:', { name, phoneNumber, reason })

    return {
      name,
      phone_number: phoneNumber,
      reason,
      start_time: event.start.dateTime,
      end_time: event.end.dateTime,
    }
  }
}

module.exports = AIService
