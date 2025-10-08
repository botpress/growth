import { RuntimeError } from '@botpress/client'
import { FormTemplateResponseSchema, SubmitFormInputSchema, SubmitFormResponseSchema } from 'definitions/schemas'
import * as bp from '.botpress'
import { extractError } from 'misc/utils/errorUtils'
import { getAxiosClient } from 'src/utils/http'
import { mapFormValuesByTitle } from 'src/utils/formMapping'

export const submitForm: bp.Integration['actions']['submitForm'] = async ({ client, ctx, input, logger }) => {
  try {
    const parsed = SubmitFormInputSchema.parse(input)
    const http = await getAxiosClient({ ctx, client })

    // getting schema for given form
    const getExtension = `digital-forms-schemas/${parsed.df_data.schema_id}`
    logger.forBot().debug(`GET ${getExtension}`)
    const getResponse = await http.get(getExtension)

    // mapping the keys given to the respective ID
    const payload = mapFormValuesByTitle(FormTemplateResponseSchema.parse(getResponse.data), parsed, logger)

    // submitting the form
    const extension = 'digital-forms'
    logger.forBot().debug(`POST ${extension} payload=${JSON.stringify(payload)}`)
    const response = await http.post(extension, payload)
    return SubmitFormResponseSchema.parse(response.data)
  } catch (error) {
    throw new RuntimeError(extractError(error, logger))
  }
}
