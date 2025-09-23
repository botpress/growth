import axios from 'axios'
import * as bp from '../.botpress'

export const getIdForSubject = (subject: string, conversation: bp.AnyMessageProps['conversation']): string => {
  return `${subject}::${conversation.tags.id}`
}

export const forceCloseConversation = async (
  ctx: bp.AnyMessageProps['ctx'],
  conversation: bp.AnyMessageProps['conversation'],
) => {
  void axios.post(process.env.BP_WEBHOOK_URL + '/' + ctx.webhookId, {
    type: 'INTERNAL_FORCE_CLOSE_CONVERSATION',
    transport: {
      key: conversation.tags.transportKey,
    },
  })

  // We need to keep the process running for a little bit more, otherwise the lambda will not do the call above
  await new Promise((resolve) => setTimeout(resolve, 1000))
}

export const getFileExtensionFromUrl = (fileUrl: string): string => {
  const url = new URL(fileUrl.trim())
  return url.pathname.includes('.') ? (url.pathname.split('.').pop()?.toLowerCase() ?? '') : ''
}
