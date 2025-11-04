import { z } from '@botpress/sdk'
import { FilterableClientDataSchema } from 'definitions/schemas'

type FilterableClientData = z.infer<typeof FilterableClientDataSchema>

export function filterEmptyValues(data: FilterableClientData): FilterableClientData {
  const filtered: FilterableClientData = {}
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null && value !== '') {
      filtered[key] = value
    }
  }
  return filtered
}
