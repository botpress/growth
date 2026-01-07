import { z } from 'zod'

/**
 * Type-safe JSON parser that returns a validated result
 */
export function parseAndValidate<T>(jsonString: string, schema: z.ZodSchema<T>): z.SafeParseReturnType<T, T> {
  try {
    const parsed = JSON.parse(jsonString)
    return schema.safeParse(parsed)
  } catch (error) {
    return {
      success: false,
      error: new z.ZodError([
        {
          code: 'custom',
          message: error instanceof Error ? error.message : 'JSON parse error',
          path: [],
        },
      ]),
    }
  }
}
