import { z } from '@botpress/sdk'
import { isApiError } from '@botpress/client'
import * as types from './types'

import queryString from 'query-string'
import { twiml } from 'twilio'

const getInputIssues = (body: any): any[] => {
  const bodySchema = z.object({
    AccountSid: z.string(),
    CallSid: z.string(),
    SpeechResult: z.string().optional(),
  })

  try {
    bodySchema.parse(body)
    return []
  } catch (thrown) {
    const e = thrown as z.ZodError

    return e.issues
  }
}

const handleIncoming = async ({ req, client, logger }: types.HandlerProps) => {
  if (req.path !== '') {
    return {
      status: 404,
      body: 'Not found',
    }
  }

  const data = queryString.parse(req.body!)

  const inputIssues = getInputIssues(data)

  if (inputIssues.length > 0) {
    return {
      status: 400,
      body: 'Validation Error! Issues:' + '\n' + JSON.stringify(inputIssues),
    }
  }

  const callSid = data.CallSid as string
  const accountSid = data.AccountSid as string
  const speechResult = data?.SpeechResult

  try {
    const { conversation } = await client.getOrCreateConversation({
      channel: 'channel',
      tags: {
        callSid,
      },
    })

    const { user } = await client.getOrCreateUser({
      tags: {
        accountSid,
      },
    })

    const prompt = (speechResult as string) || ''
    logger.forBot().info(`Sending the following prompt to the bot: ${prompt}`)

    await client.createMessage({
      tags: {
        id: callSid,
      },
      type: 'text',
      userId: user.id,
      conversationId: conversation.id,
      payload: { text: prompt },
    })

    const twimlResponse = new twiml.VoiceResponse()
    //Giving Botpress 10 seconds to cal Twilio API with response
    twimlResponse.pause({ length: 10 })

    return {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
      body: twimlResponse.toString(),
    }
  } catch (error) {
    if (isApiError(error) && error?.code === 401) {
      return {
        status: 401,
        body: 'Unauthorized. Please add a valid token to the Authorization header. You can get it at https://app.botpress.cloud/profile/settings',
      }
    }

    return {
      status: 520,
      body: 'Unknown Error! Please contact the Botpress Team',
    }
  }
}

export default handleIncoming
