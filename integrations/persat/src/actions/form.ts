import { RuntimeError } from '@botpress/client'
import { FormTemplateResponseSchema, SubmitFormInputSchema, SubmitFormResponseSchema } from 'definitions/schemas'
import * as bp from '.botpress'
import { extractError } from 'misc/utils/errorUtils'
import { getAxiosClient } from 'src/utils/http'
import { mapFormValuesByTitle } from 'src/utils/maps'

export const submitForm: bp.Integration['actions']['submitForm'] = async ({ client, ctx, input, logger }) => {
  try {
    const parsed = SubmitFormInputSchema.parse(input)
    const http = await getAxiosClient({ ctx, client })

    // get form schema with widgets
    const extension = `digital-forms-schemas/${parsed.df_data.schema_id}`
    logger.forBot().debug(`GET ${extension}`)
    const response = await http.get(extension)

    // map widget titles to widget IDs
    const payload = mapFormValuesByTitle(FormTemplateResponseSchema.parse(response.data), parsed, logger)

    // submit the form
    const submitExtension = 'digital-forms'
    logger.forBot().debug(`POST ${submitExtension} payload=${JSON.stringify(payload)}`)
    const submitResponse = await http.post(submitExtension, payload)
    return SubmitFormResponseSchema.parse(submitResponse.data)
  } catch (error) {
    throw new RuntimeError(extractError(error, logger))
  }
}
