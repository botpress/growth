import crypto from 'crypto'
import { AttributeMapping, ColumnNameMapping } from '../types/magento'

export function toMagentoAttributeCode(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

export function shortenColumnName(name: string): string {
  if (name.length <= 30) {
    return name
  }
  
  const truncated = name.substring(0, 26)
  const hash = crypto.createHash('md5').update(name).digest('hex').substring(0, 3)
  return `${truncated}_${hash}`
}

export function parseAttributeMappings(attributeMappingsInput: string | Record<string, Record<string, string>> | undefined): AttributeMapping {
  if (typeof attributeMappingsInput === 'string') {
    try {
      return JSON.parse(attributeMappingsInput)
    } catch (e) {
      return {}
    }
  } else if (typeof attributeMappingsInput === 'object' && attributeMappingsInput !== null) {
    return attributeMappingsInput
  }
  return {}
}

export function parseColumnNameMappings(columnNameMappingsInput: string | undefined): ColumnNameMapping {
  if (typeof columnNameMappingsInput === 'string') {
    try {
      return JSON.parse(columnNameMappingsInput)
    } catch (e) {
      return {}
    }
  }
  return {}
}
