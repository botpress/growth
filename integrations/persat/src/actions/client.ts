import { RuntimeError } from '@botpress/client'
import { ClientResponseSchema, ClientSchema, SearchSchema, UpdateClientResponseSchema } from 'definitions/schemas'
import * as bp from '.botpress'
import { extractError } from 'misc/utils/errorUtils'
import { getAxiosClient } from 'src/http'

export const getClient: bp.Integration['actions']['getClient'] = async ({ client, ctx, input, logger }) => {
  try {
    const parsedInput = SearchSchema.parse(input)
    const extension = `clients/${parsedInput.uid_client}`
    const http = await getAxiosClient({ ctx, client })
    logger.forBot().debug(`GET ${extension}`)
    const response = await http.get(extension)
    return ClientResponseSchema.parse(response.data)
  } catch (error) {
    throw new RuntimeError(extractError(error, logger))
  }
}

export const updateClient: bp.Integration['actions']['updateClient'] = async ({ client, ctx, input, logger }) => {
  try {
    const { uid_client, ...rest } = ClientSchema.parse(input)
    const http = await getAxiosClient({ ctx, client })
    const extension = `clients/${uid_client}`
    logger.forBot().debug(`PUT ${extension} payload=${JSON.stringify(rest)}`)
    const response = await http.put(extension, rest)
    return UpdateClientResponseSchema.parse(response.data)
  } catch (error) {
    throw new RuntimeError(extractError(error, logger))
  }
}

export const createClient: bp.Integration['actions']['createClient'] = async ({ client, ctx, input, logger }) => {
  try {
    const payload = ClientSchema.parse(input)
    const http = await getAxiosClient({ ctx, client })
    logger.forBot().debug(`POST clients payload=${JSON.stringify(payload)}`)
    const response = await http.post('clients', payload)
    return ClientResponseSchema.parse(response.data)
  } catch (error) {
    throw new RuntimeError(extractError(error, logger))
  }
}
