const axios = require('axios')

class PhoneCallService {
  constructor() {
    this.retellApiKey = process.env.RETELL_API_KEY
    this.retellAgentId = process.env.RETELL_AGENT_ID
    this.fromPhoneNumber = process.env.FROM_PHONE_NUMBER
    this.apiUrl = 'https://api.retellai.com/v2/create-phone-call'
  }

  async makeCall(clientInfo) {
    try {
      if (!clientInfo.phone_number) {
        throw new Error('Phone number is required')
      }

      const requestBody = {
        from_number: this.fromPhoneNumber,
        to_number: clientInfo.phone_number,
        retell_llm_dynamic_variables: {
          name: clientInfo.name,
          phone_number: clientInfo.phone_number,
          reason: clientInfo.reason,
          start_time: clientInfo.start_time,
          end_time: clientInfo.end_time,
        },
        override_agent_id: this.retellAgentId,
      }

      console.log('📞 Making phone call with data:', requestBody)

      const response = await axios.post(this.apiUrl, requestBody, {
        headers: {
          Authorization: `Bearer ${this.retellApiKey}`,
          'Content-Type': 'application/json',
        },
      })

      console.log('✅ Phone call created successfully:', response.data)
      return response.data
    } catch (error) {
      console.error(
        '❌ Error making phone call:',
        error.response?.data || error.message
      )
      throw error
    }
  }

  async getCallStatus(callId) {
    try {
      const response = await axios.get(
        `https://api.retellai.com/v2/call/${callId}`,
        {
          headers: {
            Authorization: `Bearer ${this.retellApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      )

      return response.data
    } catch (error) {
      console.error(
        '❌ Error getting call status:',
        error.response?.data || error.message
      )
      throw error
    }
  }
}

module.exports = PhoneCallService
