import { z } from '@botpress/sdk'
import { productCreatedSchema, productDeletedSchema, productUpdatedSchema } from 'src/schemas/events'

export type ProductCreated = z.infer<typeof productCreated.schema>

export const productCreated = {
  schema: productCreatedSchema  ,
  ui: {},
}

export type ProductDeleted = z.infer<typeof productDeleted.schema>

export const productDeleted = {
  schema: productDeletedSchema,
  ui: {},
}

export type ProductUpdated = z.infer<typeof productUpdated.schema>

export const productUpdated = {
  schema: productUpdatedSchema,
  ui: {},
}