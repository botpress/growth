import { z, IntegrationDefinition } from '@botpress/sdk'
import { wechatMessageChannels } from './definitions/channels'
import { integrationName } from './package.json'
export default new IntegrationDefinition({
  name: integrationName,
  version: '1.0.2',
  title: 'WeChat',
  description: 'Engage with your WeChat audience in real-time.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: z.object({
      wechatToken: z.string().min(1).describe('Token used for WeChat signature verification').title('WeChat Token'),
      appId: z.string().min(1).describe('WeChat Official Account AppID').title('App ID'),
      appSecret: z.string().min(1).describe('WeChat Official Account AppSecret').title('App Secret'),
    }),
  },
  channels: {
    channel: {
      title: 'Channel',
      description: 'WeChat Channel',
      messages: wechatMessageChannels,
      message: {
        tags: {
          id: { title: 'ID', description: 'The message id' },
          chatId: { title: 'Chat ID', description: 'The message Chat id' },
        },
      },
      conversation: {
        tags: {
          id: { title: 'ID', description: 'The conversation ID' },
          fromUserId: { title: 'From User ID', description: 'The conversation From User id' },
          fromUserUsername: { title: 'From User UserName', description: 'The converstation from user username' },
          fromUserName: { title: 'From User Name', description: 'The conversation from user name' },
          chatId: { title: 'Chat ID', description: 'The conversation Chat id' },
        },
      },
    },
  },
  actions: {},
  events: {},
  user: {
    tags: {
      id: { title: 'ID', description: 'The id of the user' },
    },
  },
})