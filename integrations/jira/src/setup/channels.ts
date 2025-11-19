import * as bp from '../../.botpress'
import { RuntimeError } from '@botpress/sdk'

class NotImplementedError extends RuntimeError {
  constructor() {
    super('Channel messages are not implemented for Jira integration')
  }
}

export const channels = {
  channel: {
    messages: {
      text: async (_props: bp.MessageProps['channel']['text']) => {
        throw new NotImplementedError()
      },
      image: async (_props: bp.MessageProps['channel']['image']) => {
        throw new NotImplementedError()
      },
      audio: async (_props: bp.MessageProps['channel']['audio']) => {
        throw new NotImplementedError()
      },
      video: async (_props: bp.MessageProps['channel']['video']) => {
        throw new NotImplementedError()
      },
      file: async (_props: bp.MessageProps['channel']['file']) => {
        throw new NotImplementedError()
      },
      location: async (_props: bp.MessageProps['channel']['location']) => {
        throw new NotImplementedError()
      },
      carousel: async (_props: bp.MessageProps['channel']['carousel']) => {
        throw new NotImplementedError()
      },
      card: async (_props: bp.MessageProps['channel']['card']) => {
        throw new NotImplementedError()
      },
      choice: async (_props: bp.MessageProps['channel']['choice']) => {
        throw new NotImplementedError()
      },
      dropdown: async (_props: bp.MessageProps['channel']['dropdown']) => {
        throw new NotImplementedError()
      },
      bloc: async (_props: bp.MessageProps['channel']['bloc']) => {
        throw new NotImplementedError()
      },
    },
  },
} satisfies bp.IntegrationProps['channels']
