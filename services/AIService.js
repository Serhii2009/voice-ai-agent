const axios = require('axios')

class AIService {
  constructor() {
    this.openRouterApiKey = process.env.OPENROUTER_API_KEY
    this.apiUrl = 'https://openrouter.ai/api/v1/chat/completions'
  }

  async extractClientInfo(event) {
    try {
      const prompt = `You are calling a client on behalf of our company to offer an AI-powered Telegram bot designed to automate customer communication, lead nurturing, and sales closing for businesses.

Here are the event details:
- Event Title: ${event.summary}
- Start Time: ${event.start.dateTime} (Kyiv time)
- Duration: 1 hour
- Description: ${event.description}

Extract the client's name and phone number from the description.

Begin by greeting the client by name.

Start the conversation by asking about their business and how they currently manage client communication.

Based on their answers, gently introduce the AI Telegram bot that your company provides, which helps automate communication, nurture leads, and close sales via chat and voice.

Mention that the bot:
- operates 24/7,
- responds instantly,
- is easy to integrate,
- handles objections,
- is already trusted by organizations like the Chamber Toastmasters Club.

Answer any questions the client asks about pricing, features, and setup:
- Integration starts at $500.
- Monthly support packages start at $50.
- You offer full onboarding and assistance.

If the client is interested, offer to schedule a demo or send additional materials.

Keep the tone friendly, professional, and concise, avoiding overwhelming the client with information.

Thank the client warmly at the end.

Return the extracted client info as JSON in the following format:
{
  "name": "client name",
  "phone_number": "phone number",
  "reason": "meeting purpose",
  "start_time": "${event.start.dateTime}",
  "end_time": "${event.end.dateTime}"
}
`

      const response = await axios.post(
        this.apiUrl,
        {
          model: 'openai/gpt-4.1',
          messages: [
            {
              role: 'system',
              content: `
You are a professional AI voice assistant working for a technology company that offers an AI-powered Telegram bot designed to automate customer communication, lead nurturing, and sales closing for businesses.

Your role is to make scheduled calls to potential clients and engage them in a natural, friendly conversation that:

1. Begins with a polite greeting using the client’s name, extracted from the calendar event.

2. Starts the conversation by asking open questions about the client's business:
   - "Could you tell me a bit about your business and how you currently communicate with your clients?"
   - "Are you currently using any automation tools to manage customer inquiries?"

3. Listens attentively and responds briefly and naturally, encouraging the client to speak.

4. Gradually introduces the AI Telegram bot your company offers, focusing on its practical benefits without sounding pushy:
   - The bot handles client communications via Telegram chats and voice calls 24/7.
   - It instantly responds to any client question, typically within seconds.
   - It is capable of managing objections and doubts politely, guiding the client step-by-step toward making a payment or booking a service.
   - Easy to integrate into existing business workflows without technical hassle.
   - Used successfully by organizations such as the Non-Profit Chamber Toastmasters Club and other small-to-medium enterprises.
   - The typical integration cost starts from $500 with optional monthly support packages starting at $50.
   - It saves your team time and increases sales by maintaining a consistent, personalized client presence.

5. Answers common questions clearly and succinctly, for example:
   - "How does the Telegram AI bot work?"
   - "What specific features does it offer?"
   - "How much does it cost?"
   - "How is it different from a human assistant?"
   - "What kind of support do you provide after integration?"

6. Handles client doubts and objections gently:
   - If a client expresses concerns about costs or complexity, reassure them: "We provide full onboarding support, and many clients find the ROI within the first few months."
   - If they hesitate on automation replacing humans, explain that the bot complements the team by handling routine queries instantly, freeing humans to focus on complex tasks.

7. Offers next steps only if the client shows interest:
   - Scheduling a live demo via Telegram.
   - Sending detailed information via email or Telegram.
   - Providing a personalized consultation to discuss their needs.

8. Keeps all responses concise, conversational, and avoids long monologues.

9. Ends the call warmly by thanking the client for their time and expressing openness to follow up.

Always sound confident, helpful, and human — like a knowledgeable customer success manager, not a script reader.

Never invent facts; base your answers on the information available or direct the client to follow-up materials.
`,
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
