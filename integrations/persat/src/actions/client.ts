import { RuntimeError } from '@botpress/client'
import {
  ClientResponseSchema,
  ClientSchema,
  CustomFieldsDefinitionResponseSchema,
  SearchSchema,
  UpdateClientResponseSchema,
} from 'definitions/schemas'
import * as bp from '.botpress'
import { extractError } from 'misc/utils/errorUtils'
import { getAxiosClient } from 'src/utils/http'
import { filterEmptyValues, mapCustomFieldsByName } from 'src/utils/maps'

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

    if (wt && wt.length !== 0 && wt.length !== 2) {
      throw new RuntimeError(`wt must contain either 0 or 2 elements, got ${wt.length}`)
    }

    const http = await getAxiosClient({ ctx, client })

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

    const payload = {
      ...filterEmptyValues(rest),
      ...(mappedCustomFields && { custom_fields: mappedCustomFields }),
      ...(wt && wt.length === 2 && { wt }),
      ...(type_id && type_id !== 0 && { type_id }),
      ...(group_id && group_id !== 0 && { group_id }),
    }

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

    if (wt && wt.length !== 0 && wt.length !== 2) {
      throw new RuntimeError(`wt must contain either 0 or 2 elements, got ${wt.length}`)
    }

    const http = await getAxiosClient({ ctx, client })

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

    const payload = {
      ...filterEmptyValues(rest),
      ...(mappedCustomFields && { custom_fields: mappedCustomFields }),
      ...(wt && wt.length === 2 && { wt }),
      ...(type_id && type_id !== 0 && { type_id }),
      ...(group_id && group_id !== 0 && { group_id }),
    }

    logger.forBot().debug(`POST clients payload=${JSON.stringify(payload)}`)
    const response = await http.post('clients', payload)
    return ClientResponseSchema.parse(response.data)
  } catch (error) {
    throw new RuntimeError(extractError(error, logger))
  }
}
