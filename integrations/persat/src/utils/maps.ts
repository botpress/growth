import { RuntimeError, z } from '@botpress/sdk'
import {
  FormTemplateResponseSchema,
  SubmitFormInputSchema,
  CustomFieldsDefinitionResponseSchema,
} from 'definitions/schemas'
import { extractError } from 'misc/utils/errorUtils'
import * as bp from '.botpress'

type FormTemplate = z.infer<typeof FormTemplateResponseSchema>
type SubmitFormInput = z.infer<typeof SubmitFormInputSchema>
type CustomFieldsDefinition = z.infer<typeof CustomFieldsDefinitionResponseSchema>

export function mapCustomFieldsByName(
  customFieldsDefinition: CustomFieldsDefinition,
  customFieldsInput: string,
  logger: bp.Logger
): Record<string, any> {
  try {
    const inputFields = customFieldsInput ? JSON.parse(customFieldsInput) : {}

    const nameToIdMap = new Map<string, string>()
    for (const field of customFieldsDefinition.data) {
      nameToIdMap.set(field.name, field.id.toString())
    }

    const mappedFields: Record<string, any> = {}
    for (const [key, value] of Object.entries(inputFields)) {
      const fieldId = nameToIdMap.get(key)
      if (fieldId) {
        mappedFields[fieldId] = value
      } else {
        throw new RuntimeError(
          `Invalid custom field provided "${key}", must be one of the following: ${Array.from(nameToIdMap.keys()).join(', ')}`
        )
      }
    }

    return mappedFields
  } catch (error) {
    throw new RuntimeError(extractError(error, logger))
  }
}

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
          `Invalid form field provided "${key}", must be one of the following: ${Array.from(titleToIdMap.keys()).join(', ')}`
        )
      }
    }

    return {
      uid_client: formInput.uid_client,
      df_data: {
        schema_id: formTemplate.data.schema_id,
        formvalues: mappedValues,
      },
    }
  } catch (error) {
    throw new RuntimeError(extractError(error, logger))
  }
}
