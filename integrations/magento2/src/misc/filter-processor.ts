import { ProductAttributeSchema } from './zod-schemas'
import { MagentoClient } from '../magentoClient'

// Standard product fields that don't require attribute mapping
export const STANDARD_FIELDS = [
  'sku', 'name', 'description', 'price', 'original_price', 'currency', 
  'image_url', 'thumbnail_url', 'stock_qty', 'is_in_stock', 'average_rating', 'review_count'
]

// Filter interface
export interface Filter {
  field: string
  condition: string
  value?: string | number
}

// Attribute mapping interface
export interface AttributeMapping {
  [attributeCode: string]: {
    [label: string]: string
  }
}

// Configuration interface for filter processing
export interface FilterProcessorConfig {
  magentoClient: MagentoClient
  logger: any
}

/**
 * Extracts custom attribute fields from filters that are not standard fields
 */
export function extractCustomAttributeFields(filters: Filter[]): string[] {
  return Array.from(
    new Set(
      filters
        .map((f) => f.field)
        .filter((field) => field && !STANDARD_FIELDS.includes(field))
    )
  )
}

/**
 * Fetches attribute mappings for custom attributes from Magento
 */
export async function fetchAttributeMappings(
  attributeFields: string[],
  config: FilterProcessorConfig
): Promise<AttributeMapping> {
  const { magentoClient, logger } = config
  const attributeMappings: AttributeMapping = {}

  for (const attrCode of attributeFields) {
    try {
      const attribute = await magentoClient.getAttribute(attrCode, logger)
      const parsedAttribute = ProductAttributeSchema.parse(attribute)
      
      if (parsedAttribute.options && parsedAttribute.options.length > 0) {
        attributeMappings[attrCode] = {}
        for (const option of parsedAttribute.options) {
          attributeMappings[attrCode][option.label] = option.value
        }
        logger.forBot().info(`Fetched ${parsedAttribute.options.length} options for attribute ${attrCode}`)
      }
    } catch (error) {
      logger.forBot().warn(`Failed to get attribute mapping for ${attrCode}:`, error)
    }
  }

  return attributeMappings
}

/**
 * Applies attribute mappings to filter values
 */
export function applyAttributeMappings(
  filters: Filter[],
  attributeMappings: AttributeMapping
): Filter[] {
  return filters.map((filter) => {
    if (
      filter.field !== undefined &&
      filter.value !== undefined &&
      attributeMappings[filter.field]?.[filter.value] !== undefined
    ) {
      return { ...filter, value: attributeMappings[filter.field]?.[filter.value] }
    }
    return filter
  })
}

/**
 * Converts filters to Magento search criteria URL parameters
 */
export function buildSearchCriteria(filters: Filter[]): string {
  const filterGroups: string[] = []
  
  filters.forEach((filter, idx) => {
    if (!filter.field || !filter.condition) return
    
    const filterGroup = `searchCriteria[filterGroups][${idx}][filters][0][field]=${encodeURIComponent(filter.field)}&searchCriteria[filterGroups][${idx}][filters][0][conditionType]=${filter.condition}`
    
    if (filter.value && filter.condition !== 'notnull' && filter.condition !== 'null') {
      filterGroups.push(`${filterGroup}&searchCriteria[filterGroups][${idx}][filters][0][value]=${encodeURIComponent(filter.value)}`)
    } else {
      filterGroups.push(filterGroup)
    }
  })
  
  return filterGroups.join('&')
}

/**
 * Main function to process filters and return search criteria
 */
export async function processFilters(
  filtersJson: string | undefined,
  config: FilterProcessorConfig
): Promise<{ filterCriteria: string; attributeMappings: AttributeMapping }> {
  let filterCriteria = ''
  let attributeMappings: AttributeMapping = {}

  if (!filtersJson) {
    return { filterCriteria, attributeMappings }
  }

  try {
    let filters = JSON.parse(filtersJson)
    
    if (!Array.isArray(filters)) {
      throw new Error('filters_json must be a JSON array')
    }

    // Extract custom attribute fields that need mapping
    const attributeFields = extractCustomAttributeFields(filters)

    // Fetch attribute mappings for custom attributes
    if (attributeFields.length > 0) {
      attributeMappings = await fetchAttributeMappings(attributeFields, config)
    }

    // Apply attribute mappings to filter values
    filters = applyAttributeMappings(filters, attributeMappings)

    // Build search criteria
    filterCriteria = buildSearchCriteria(filters)

  } catch (err) {
    throw new Error(`filters_json is not valid JSON: ${err instanceof Error ? err.message : 'Unknown parsing error'}`)
  }

  return { filterCriteria, attributeMappings }
}

/**
 * Validates filter structure
 */
export function validateFilter(filter: any): filter is Filter {
  return (
    typeof filter === 'object' &&
    filter !== null &&
    typeof filter.field === 'string' &&
    typeof filter.condition === 'string'
  )
}

/**
 * Validates an array of filters
 */
export function validateFilters(filters: any[]): filters is Filter[] {
  return Array.isArray(filters) && filters.every(validateFilter)
}
