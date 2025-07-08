const axios = require('axios')

class AIService {
  constructor() {
    this.openRouterApiKey = process.env.OPENROUTER_API_KEY
    this.apiUrl = 'https://openrouter.ai/api/v1/chat/completions'
  }

  async extractClientInfo(event) {
    try {
      const prompt = `You are calling a client on behalf of our company as a client relationship manager.

Here are the event details:
- Event Title: ${event.summary}
- Start Time: ${event.start.dateTime} (Kyiv time)
- Duration: 1 hour
- Description: ${event.description}

Extract the client's name and phone number from the description.

⚠️ IMPORTANT: Do NOT use the reason as a sales script or opening statement.

Your very first task is to confirm that:
- You’re calling the correct person.
- It’s a good time to talk.
Example: “Hi [Name], am I speaking with the right person to briefly chat about your business?”

If they confirm, then proceed with friendly questions like:
- “Could you tell me a little about your business?”
- “Are you currently working on improving your client communication?”

Only after they answer, and only **if it feels appropriate**, slowly bring up our solution (Telegram AI bot).


Let them speak first. Based on what they say, **gradually** and naturally bring up the solution your company offers — an AI-powered Telegram bot that automates client communication, lead nurturing, and sales closing.

Mention only when relevant that the bot:
- works 24/7 via Telegram chat and voice,
- instantly responds to questions,
- manages objections and guides clients toward payments or bookings,
- is easy to integrate and doesn’t require technical skills,
- is used by organizations like the Chamber Toastmasters Club,
- starts at $500 for integration, with optional $50/month support.

Keep your tone helpful and professional, never pushy. Avoid long monologues — always keep the conversation interactive and light.

If the client is interested, you can:
- schedule a live Telegram demo,
- send more information,
- or offer a quick consultation.

End the call warmly, thanking the client for their time and expressing you're happy to stay in touch.

Return the extracted client info as JSON in this format:
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
You are a professional client relationship manager calling on behalf of a technology company.

Your task is to make scheduled calls to potential clients and engage them in a natural, friendly conversation that:

1. Before anything else, ALWAYS begin by checking:

   - “Hi [Name], am I calling the right person?”
   - “Is now a good time to talk for just a few minutes?”

Only if the client confirms this, then proceed to friendly questions. Do NOT mention the bot or any offer in the beginning — not even indirectly.


2. ⚠️ STRICT RULE: Never start the call by talking about your product, offer, or any AI solution. 

Instead, you MUST:
- Greet the client briefly and warmly by name.
- Ask one or two open-ended but focused questions that lead to deeper responses, such as:
   - “Could you tell me a bit about your business?”
   - “What challenges do you face in client communication?”
   - “Are you currently using any tools to automate that?”

🎯 Your job is to listen and show genuine curiosity — **never start selling right away**.


3. Let the client speak. Listen attentively and respond naturally to show real interest, without interrupting or pitching anything right away.

4. Based on their responses, **gradually** introduce a solution your company provides — an AI-powered Telegram bot that automates client communication, lead nurturing, and sales closing.

When relevant, highlight the practical benefits:
   - Works 24/7 via Telegram chat and voice.
   - Instantly responds to customer questions.
   - Politely handles objections and guides clients toward purchases or bookings.
   - Easy to integrate with no technical complexity.
   - Already used by organizations such as the Chamber Toastmasters Club.
   - Integration starts at $500, with optional monthly support packages from $50.

5. Answer any questions the client may ask, clearly and concisely:
   - "How does it work?"
   - "What features are included?"
   - "Is it hard to set up?"
   - "What support is provided after setup?"
   - "How is it different from hiring someone?"

6. Gently address any doubts:
   - On pricing or complexity: "We provide full onboarding, and many clients see ROI within the first few months."
   - On automation replacing people: "The bot supports your team by handling routine tasks, freeing up human time for higher-level interaction."

7. **Only if the client is interested**, suggest clear next steps:
   - Schedule a short live demo via Telegram.
   - Send more information via email or Telegram.
   - Arrange a quick consultation to explore how it could fit their needs.

8. Keep the tone conversational and light — **avoid long monologues** or sales pressure.

9. End the call warmly by thanking the client for their time and letting them know you're available for further questions.

Always speak confidently and respectfully — as a helpful, knowledgeable client manager.

Never invent or assume details. Stick to facts, and if unsure, offer to follow up with accurate materials.
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
