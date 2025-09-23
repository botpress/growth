import * as bp from '.botpress'
import { MagentoConfiguration, Filter, AttributeMapping, MagentoProduct } from '../types/magento'
import { ProductAttributeSchema, ProductListSchema } from '../misc/zod-schemas'
import { createMagentoClient } from './magento-client'

function createFilterGroup(filters: Filter[], groupIndex: number): string[] {
  return filters
    .map((filter: Filter, filterIndex: number) => {
      if (!filter.field || !filter.condition) return ''

      const base = `searchCriteria[filterGroups][${groupIndex}][filters][${filterIndex}][field]=${encodeURIComponent(
        filter.field
      )}&searchCriteria[filterGroups][${groupIndex}][filters][${filterIndex}][condition_type]=${filter.condition}`

      if (
        filter.value !== undefined &&
        filter.value !== null &&
        filter.condition !== 'notnull' &&
        filter.condition !== 'null'
      ) {
        return `${base}&searchCriteria[filterGroups][${groupIndex}][filters][${filterIndex}][value]=${encodeURIComponent(
          filter.value.toString()
        )}`
      }

      return base
    })
    .filter(Boolean)
}

export function buildFilterCriteria(filters: Filter[]): string {
  const filterGroups: string[] = []
  const fieldGroups: Record<string, Filter[]> = {}
  const separateGroups: Filter[] = []

  // Group filters by field type
  filters.forEach((filter: Filter) => {
    if (!filter.field || !filter.condition) return

    if (filter.field === 'price' && (filter.condition === 'from' || filter.condition === 'to')) {
      separateGroups.push(filter)
    } else {
      fieldGroups[filter.field] = fieldGroups[filter.field] || []
      fieldGroups[filter.field]!.push(filter)
    }
  })

  let groupIndex = 0

  // Process grouped filters
  Object.entries(fieldGroups).forEach(([_, fieldFilters]) => {
    const groupFilters = createFilterGroup(fieldFilters, groupIndex)
    filterGroups.push(...groupFilters)
    groupIndex++
  })

  // Process separate price filters
  separateGroups.forEach((filter: Filter) => {
    if (!filter.field || !filter.condition) return

    const base = `searchCriteria[filterGroups][${groupIndex}][filters][0][field]=${encodeURIComponent(
      filter.field
    )}&searchCriteria[filterGroups][${groupIndex}][filters][0][condition_type]=${filter.condition}`

    if (filter.value && filter.condition !== 'notnull' && filter.condition !== 'null') {
      filterGroups.push(
        `${base}&searchCriteria[filterGroups][${groupIndex}][filters][0][value]=${encodeURIComponent(filter.value.toString())}`
      )
    } else {
      filterGroups.push(base)
    }
    groupIndex++
  })

  return filterGroups.join('&')
}

async function fetchAttributeOptions(
  attrCode: string,
  config: MagentoConfiguration,
  log: bp.Logger
): Promise<Record<string, string> | null> {
  try {
    const client = createMagentoClient(config, log)
    const attribute = await client.getAttributeOptions(attrCode)
    const parsedAttribute = ProductAttributeSchema.parse(attribute)

    if (parsedAttribute.options && parsedAttribute.options.length > 0) {
      const options: Record<string, string> = {}
      for (const option of parsedAttribute.options) {
        options[option.label] = option.value
      }
      log.info(`Fetched ${parsedAttribute.options.length} options for attribute ${attrCode}`)
      return options
    }
    return null
  } catch (error) {
    log.warn(`Failed to get attribute mapping for ${attrCode}:`, error)
    return null
  }
}

export async function processFilters(
  filtersJson: string,
  attributeMappings: AttributeMapping,
  config: MagentoConfiguration,
  log: bp.Logger
): Promise<string> {
  try {
    let filters: Filter[] = JSON.parse(filtersJson)
    if (!Array.isArray(filters)) {
      throw new Error('filters_json must be a JSON array')
    }

    const standardFields = [
      'sku',
      'name',
      'description',
      'price',
      'original_price',
      'currency',
      'image_url',
      'thumbnail_url',
      'stock_qty',
      'is_in_stock',
      'average_rating',
      'review_count',
    ]
    const attributeFields = Array.from(
      new Set(
        filters
          .map((f: Filter) => f.field)
          .filter((f: string | undefined): f is string => f !== undefined && !standardFields.includes(f))
      )
    )

    // Fetch attribute mappings for custom fields
    for (const attrCode of attributeFields) {
      const options = await fetchAttributeOptions(attrCode, config, log)
      if (options) {
        attributeMappings[attrCode] = options
      }
    }

    // Map filter values using attribute mappings
    filters = filters.map((filter: Filter) => {
      if (
        filter.field !== undefined &&
        filter.value !== undefined &&
        attributeMappings[filter.field]?.[filter.value.toString()] !== undefined
      ) {
        return {
          ...filter,
          value: attributeMappings[filter.field]?.[filter.value.toString()],
        }
      }
      return filter
    })

    return buildFilterCriteria(filters)
  } catch (err) {
    throw new Error(`filters_json is not valid JSON: ${err instanceof Error ? err.message : 'Unknown parsing error'}`)
  }
}

export async function fetchProducts(
  page: number,
  pageSize: number,
  filterCriteria: string | undefined,
  config: MagentoConfiguration,
  log: bp.Logger
): Promise<{ products: MagentoProduct[]; totalCount: number }> {
  const searchCriteria = `searchCriteria[pageSize]=${pageSize}&searchCriteria[currentPage]=${page}${filterCriteria ? `&${filterCriteria}` : ''}`
  const endpoint = `/V1/products?${searchCriteria}`

  log.info(`Fetching page ${page} with criteria: ${searchCriteria}`)

  const client = createMagentoClient(config, log)
  const productsResponse = await client.makeRequest(endpoint)

  const parsed = ProductListSchema.parse(productsResponse)
  return {
    products: parsed.items as MagentoProduct[],
    totalCount: parsed.total_count,
  }
}
