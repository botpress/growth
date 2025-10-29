import { ActionDefinition } from '@botpress/sdk'
import { SubmitFormInputSchema, SubmitFormResponseSchema } from 'definitions/schemas'

const submitForm: ActionDefinition = {
  title: 'Submit Form',
  description: 'Submits form',
  input: { schema: SubmitFormInputSchema },
  output: { schema: SubmitFormResponseSchema },
}

export const actions = {
  submitForm,
}
