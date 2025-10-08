import { RuntimeError, z } from '@botpress/sdk'
import { FormTemplateResponseSchema, SubmitFormInputSchema } from 'definitions/schemas'
import { extractError } from 'misc/utils/errorUtils'
import * as bp from '.botpress'

type FormTemplate = z.infer<typeof FormTemplateResponseSchema>
type SubmitFormInput = z.infer<typeof SubmitFormInputSchema>

export function mapFormValuesByTitle(
  formTemplate: FormTemplate,
  formInput: SubmitFormInput,
  logger: bp.Logger
): { uid_client: string; df_data: { schema_id: number; formvalues: Record<string, any> } } {
  try {
    const formValues = formInput.df_data.formvalues ? JSON.parse(formInput.df_data.formvalues) : {}

    // create map of widget title -> widget id
    const titleToIdMap = new Map<string, string>()
    for (const widget of formTemplate.data.description.widgets) {
      titleToIdMap.set(widget.title, widget.id)
    }

    // mapping values
    const mappedValues: Record<string, any> = {}
    for (const [key, value] of Object.entries(formValues)) {
      const widgetId = titleToIdMap.get(key)
      if (widgetId) {
        mappedValues[widgetId] = value
      } else {
        throw new RuntimeError(
          `Invalid form field provided ${key}, must be one of the following ${Array.from(titleToIdMap.keys()).join(', ')}`
        )
      }
    }

    return {
      uid_client: formInput.uid_client,
      df_data: {
        schema_id: formInput.df_data.schema_id,
        formvalues: mappedValues,
      },
    }
  } catch (error) {
    throw new RuntimeError(extractError(error, logger))
  }
}
