import { RuntimeError } from '@botpress/sdk'
import * as bp from '.botpress'
import { v2 } from 'pipedrive'

export const getApiConfig = async ({ ctx }: { ctx: bp.Context }) => {
  try {
    const apiKey = ctx.configuration.apiKey
    return new v2.Configuration({ apiKey })
  } catch (error) {
    console.error(error)
    throw new Error(`Failed to get API config: ${error}`)
  }
}