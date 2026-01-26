import { z } from '@botpress/sdk'

export const JsonLiteralSchema = z.union([z.string(), z.number(), z.boolean(), z.null()])
export type JsonLiteral = z.infer<typeof JsonLiteralSchema>
export type JsonValue = JsonLiteral | { [key: string]: JsonValue } | JsonValue[]
export const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([JsonLiteralSchema, z.array(JsonValueSchema), z.record(JsonValueSchema)])
)
