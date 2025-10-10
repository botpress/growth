import { RuntimeError } from '@botpress/client'
import { AxiosInstance } from 'axios'
import {
  ClientResponseSchema,
  ClientSchema,
  CustomFieldsDefinitionResponseSchema,
  SearchSchema,
  UpdateClientResponseSchema,
} from 'definitions/schemas'
import * as bp from '.botpress'
import { extractError } from 'misc/utils/errorUtils'
import { getAxiosClient } from 'src/utils/axiosClient'
import { filterEmptyValues } from 'src/utils/dataUtils'
import { mapCustomFieldsByName } from 'src/utils/mappers'

async function buildClientPayload({
  custom_fields,
  wt,
  type_id,
  group_id,
  rest,
  http,
  logger,
}: {
  custom_fields?: string
  wt?: number[]
  type_id?: number
  group_id?: number
  rest: Record<string, any>
  http: AxiosInstance
  logger: bp.Logger
}) {
  if (wt && wt.length !== 0 && wt.length !== 2) {
    throw new RuntimeError(`wt must contain either 0 or 2 elements, got ${wt.length}`)
  }

  let mappedCustomFields
  if (custom_fields && custom_fields.trim() !== '') {
    const getExtension = 'client-custom-fields'
    const getResponse = await http.get(getExtension)
    mappedCustomFields = mapCustomFieldsByName(
      CustomFieldsDefinitionResponseSchema.parse(getResponse.data),
      custom_fields,
      logger
    )
  }

  return {
    ...filterEmptyValues(rest),
    ...(mappedCustomFields && { custom_fields: mappedCustomFields }),
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

    const payload = await buildClientPayload({ custom_fields, wt, type_id, group_id, rest, http, logger })

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

    const payload = await buildClientPayload({ custom_fields, wt, type_id, group_id, rest, http, logger })

    logger.forBot().debug(`POST clients payload=${JSON.stringify(payload)}`)
    const response = await http.post('clients', payload)
    return ClientResponseSchema.parse(response.data)
  } catch (error) {
    throw new RuntimeError(extractError(error, logger))
  }
}
