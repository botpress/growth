const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const tryPick = (obj: unknown, path: string[]): unknown => {
  let current: unknown = obj
  for (const key of path) {
    if (!isObject(current) || !(key in current)) return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

const extractIdAndName = (response: unknown): { id?: number; name?: string } => {
  const candidates = [
    tryPick(response, ['data', 'data']),
    tryPick(response, ['data']),
    response,
  ]
  for (const candidate of candidates) {
    if (!isObject(candidate)) continue
    const id = (candidate as Record<string, unknown>)['id']
    const name = (candidate as Record<string, unknown>)['name']
    const out: { id?: number; name?: string } = {}
    if (typeof id === 'number') out.id = id
    if (typeof name === 'string' && name.length > 0) out.name = name
    if (out.id !== undefined || out.name !== undefined) return out
  }
  return {}
}

const extractItemsCount = (response: unknown): number => {
  const candidates = [
    tryPick(response, ['data', 'data', 'items']),
    tryPick(response, ['data', 'items']),
    tryPick(response, ['items']),
  ]
  for (const items of candidates) {
    if (Array.isArray(items)) return items.length
  }
  return 0
}

export const summarizeAddPersonSuccess = (response: unknown, personName?: string): string => {
  const { id, name } = extractIdAndName(response)
  const finalName = name || personName
  const idPart = typeof id === 'number' ? ` (ID: ${id})` : ''
  const namePart = finalName ? `: ${finalName}` : ''
  return `Person created${idPart}${namePart}.`
}

export const summarizeUpdatePersonSuccess = (response: unknown, personId: number, personName?: string): string => {
  const { name } = extractIdAndName(response)
  const finalName = name || personName
  const namePart = finalName ? `: ${finalName}` : ''
  return `Person ${personId} updated${namePart}.`
}

export const summarizeFindPersonSuccess = (response: unknown, term: string, organizationId?: number): string => {
  const count = extractItemsCount(response)
  const orgPart = typeof organizationId === 'number' && organizationId > 0 ? ` in org ${organizationId}` : ''
  const plural = count === 1 ? '' : 's'
  return `${count} person${plural} found for "${term}"${orgPart}.`
}


