export const getLibraryNames = (documentLibraryNames: string): string[] => {
  try {
    const parsed = JSON.parse(documentLibraryNames)
    if (Array.isArray(parsed)) {
      return parsed
    }
    return [parsed]
  } catch {
    return documentLibraryNames
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean)
  }
}
