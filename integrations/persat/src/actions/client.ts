import { RuntimeError } from '@botpress/client'
import { ClientResponseSchema, ClientSchema, SearchSchema, UpdateClientResponseSchema } from 'definitions/schemas'
import * as bp from '.botpress'
import { extractError } from 'misc/utils/errorUtils'
import { getAxiosClient } from 'src/utils/axiosClient'
import { filterEmptyValues } from 'src/utils/dataUtils'
// removed mapping; use values as provided

async function buildClientPayload({
  custom_fields,
  wt,
  type_id,
  group_id,
  rest,
  logger,
}: {
  custom_fields?: string
  wt?: number[]
  type_id?: number
  group_id?: number
  rest: Record<string, any>
  logger: bp.Logger
}) {
  if (wt && wt.length !== 0 && wt.length !== 2) {
    throw new RuntimeError(`wt must contain either 0 or 2 elements, got ${wt.length}`)
  }

  let parsedCustomFields: Record<string, any> | undefined
  if (custom_fields && custom_fields.trim() !== '') {
    try {
      parsedCustomFields = JSON.parse(custom_fields)
    } catch (error) {
      throw new RuntimeError(extractError(error, logger))
    }
  }

  return {
    ...filterEmptyValues(rest),
    ...(parsedCustomFields && { custom_fields: parsedCustomFields }),
    ...(wt && { wt }),
    ...(type_id && { type_id }),
    ...(group_id && { group_id }),
  }
}

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
    const { uid_client, custom_fields, wt, type_id, group_id, ...rest } = ClientSchema.parse(input)
    const http = await getAxiosClient({ ctx, client })

    const payload = await buildClientPayload({ custom_fields, wt, type_id, group_id, rest, logger })

    const extension = `clients/${uid_client}`
    logger.forBot().debug(`PUT ${extension} payload=${JSON.stringify(payload)}`)
    const response = await http.put(extension, payload)
    return UpdateClientResponseSchema.parse(response.data)
  } catch (error) {
    throw new RuntimeError(extractError(error, logger))
  }
}

export const createClient: bp.Integration['actions']['createClient'] = async ({ client, ctx, input, logger }) => {
  try {
    const { custom_fields, wt, type_id, group_id, ...rest } = ClientSchema.parse(input)
    const http = await getAxiosClient({ ctx, client })

    const payload = await buildClientPayload({ custom_fields, wt, type_id, group_id, rest, logger })

    logger.forBot().debug(`POST clients payload=${JSON.stringify(payload)}`)
    const response = await http.post('clients', payload)
    return ClientResponseSchema.parse(response.data)
  } catch (error) {
    throw new RuntimeError(extractError(error, logger))
  }
}
