import { RuntimeError } from '@botpress/client'
import { SubmitFormInputSchema, SubmitFormResponseSchema } from 'definitions/schemas'
import * as bp from '.botpress'
import { extractError } from 'misc/utils/errorUtils'
import { getAxiosClient } from 'src/utils/axiosClient'
// removed mapping; use formvalues as provided

export const submitForm: bp.Integration['actions']['submitForm'] = async ({ client, ctx, input, logger }) => {
  try {
    const parsed = SubmitFormInputSchema.parse(input)
    const http = await getAxiosClient({ ctx, client })

    const { uid_client, df_data } = parsed
    const { schema_id, formvalues } = df_data

    const parsedFormvalues = (() => {
      if (!formvalues || formvalues.trim() === '') return undefined
      try {
        return JSON.parse(formvalues)
      } catch (error) {
        throw new RuntimeError(extractError(error, logger))
      }
    })()

    const payload = {
      uid_client,
      df_data: {
        schema_id,
        ...(parsedFormvalues && { formvalues: parsedFormvalues }),
      },
    }

    // submit the form
    const submitExtension = 'digital-forms'
    logger.forBot().debug(`POST ${submitExtension} payload=${JSON.stringify(payload)}`)
    const submitResponse = await http.post(submitExtension, payload)
    return SubmitFormResponseSchema.parse(submitResponse.data)
  } catch (error) {
    throw new RuntimeError(extractError(error, logger))
  }
}
