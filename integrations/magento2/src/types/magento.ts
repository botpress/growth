import OAuth from 'oauth-1.0a'
import { Table } from '@botpress/client'
import * as bp from '.botpress'

export interface MagentoConfiguration {
  magento_domain: string
  consumer_key: string
  consumer_secret: string
  access_token: string
  access_token_secret: string
  botpress_pat: string
  user_agent?: string
  store_code?: string
}

export interface SyncInput {
  table_name: string
  custom_columns_to_add_to_table?: string
  filters_json?: string
  retrieve_reviews?: boolean
  _currentPage?: number
  _totalCount?: number
  _tableId?: string
  _runId?: string
  _customAttributeCodes?: string[]
  _attributeMappings?: string | Record<string, Record<string, string>>
  _columnNameMappings?: string
  _filterCriteria?: string
  _currentPageProductIndex?: number
}

export interface Filter {
  field?: string
  condition?: string
  value?: string | number
}

export interface OAuthConfig {
  consumer_key: string
  consumer_secret: string
  access_token: string
  access_token_secret: string
}

export interface MagentoConfig extends OAuthConfig {
  magento_domain: string
  user_agent: string
  store_code: string
}

export interface AttributeMapping {
  [attributeCode: string]: {
    [value: string]: string
  }
}

export interface ColumnNameMapping {
  [shortName: string]: string
}

export interface ProcessProductsConfig {
  logger: bp.Logger
  magento_domain: string
  oauth: OAuthClient
  token: OAuthToken
  headers: Record<string, string>
  availableColumns: string[]
  customAttributeCodes: string[]
  attributeMappings: AttributeMapping
  columnNameMappings: ColumnNameMapping
  tableSchema: TableSchema
  store_code: string
  retrieve_reviews?: boolean
}

export interface SyncResult {
  success: boolean
  synced_count: number
  total_count: number
  table_name: string
  status: string
  error?: string
}

export interface ProductRow {
  [columnName: string]: string | number | boolean | null
}

export interface SyncState {
  tableId: string
  tableSchema: TableSchema | null
  customAttributeCodes: string[]
  filterCriteria: string
  attributeMappings: AttributeMapping
  columnNameMappings: ColumnNameMapping
}

export interface BotpressContext {
  configuration: MagentoConfiguration
  botId: string
  webhookId?: string
}

// OAuth interfaces
export type OAuthClient = OAuth
export type OAuthToken = OAuth.Token

// Product interfaces
export interface MagentoProduct {
  sku: string
  name: string
  price: number
  custom_attributes?: CustomAttribute[]
  extension_attributes?: {
    stock_item?: {
      qty: number
      is_in_stock: boolean
    }
  }
  media_gallery_entries?: MediaGalleryEntry[]
}

export interface CustomAttribute {
  attribute_code: string
  value: string | number | boolean | Array<string | number>
}

export interface MediaGalleryEntry {
  file: string
}

// Stock interfaces
export interface StockItem {
  qty: number
  is_in_stock: boolean
}

// Review interfaces
export interface Review {
  ratings: ReviewRating[]
}

export interface ReviewRating {
  value: string
}

// Use the schema type from the client
export type TableSchema = Table['schema']

export interface TableProperty {
  type: string
}

// Sync context interface
export interface SyncContext {
  config: MagentoConfiguration
  oauth: OAuthClient
  token: OAuthToken
  headers: Record<string, string>
  httpHeaders: Record<string, string>
  apiBaseUrl: string
  webhookId?: string
}

// Product processing interfaces
export interface ProductProcessingContext {
  logger: bp.Logger
  magento_domain: string
  oauth: OAuthClient
  token: OAuthToken
  headers: Record<string, string>
  store_code: string
}

// API response interfaces
export interface ProductsResponse {
  items: MagentoProduct[]
  total_count: number
}

export interface AttributeOptionsResponse {
  options: AttributeOption[]
}

export interface AttributeOption {
  label: string
  value: string
}

// Webhook payload interfaces
export interface WebhookPayload {
  type: 'magentoSyncContinue'
  data: SyncWebhookData
}

export interface SyncWebhookData extends SyncInput {
  _currentPage: number
  _totalCount: number
  _tableId: string
  _runId: string
  _customAttributeCodes: string[]
  _attributeMappings: string
  _columnNameMappings: string
  _filterCriteria: string
  _currentPageProductIndex: number
}

// API request data interfaces
export interface ApiRequestData {
  searchCriteria?: {
    filterGroups?: Array<{
      filters?: Array<{
        field?: string
        conditionType?: string
        value?: string | number
      }>
    }>
    pageSize?: number
    currentPage?: number
  }
  [key: string]: unknown
}

// Magento API specific request types
export interface ProductSearchRequest extends ApiRequestData {
  searchCriteria: {
    filterGroups?: Array<{
      filters?: Array<{
        field?: string
        conditionType?: string
        value?: string | number
      }>
    }>
    pageSize?: number
    currentPage?: number
  }
}

export interface StockItemRequest extends ApiRequestData {
  stockItem: {
    qty: number
    is_in_stock: boolean
  }
}

// API Response interfaces
export interface ProductSearchResponse {
  items: MagentoProduct[]
  total_count: number
  search_criteria: {
    filter_groups: Array<{
      filters: Array<{
        field: string
        value: string
        condition_type: string
      }>
    }>
    page_size: number
    current_page: number
  }
}

export interface StockItemResponse {
  item_id: number
  product_id: number
  stock_id: number
  qty: number
  is_in_stock: boolean
  is_qty_decimal: boolean
  show_default_notification_message: boolean
  use_config_min_qty: boolean
  min_qty: number
  use_config_min_sale_qty: number
  min_sale_qty: number
  use_config_max_sale_qty: boolean
  max_sale_qty: number
  use_config_backorders: boolean
  backorders: number
  use_config_notify_stock_qty: boolean
  notify_stock_qty: number
  use_config_qty_increments: boolean
  qty_increments: number
  use_config_enable_qty_inc: boolean
  enable_qty_increments: boolean
  use_config_manage_stock: boolean
  manage_stock: boolean
  low_stock_date: string | null
  is_decimal_divided: boolean
  stock_status_changed_auto: number
}

export interface ReviewResponse {
  items: Array<{
    review_id: number
    created_at: string
    entity_id: number
    entity_pk_value: number
    status_id: number
    detail_id: number
    title: string
    detail: string
    nickname: string
    customer_id: number | null
    store_id: number
    stores: number[]
    rating_votes: Array<{
      vote_id: number
      option_id: number
      entity_id: number
      percent: number
      value: number
    }>
  }>
  total_count: number
}

// Product attribute interfaces
export interface ProductAttributeResponse {
  attribute_id: number
  attribute_code: string
  frontend_input: string
  entity_type_id: string
  is_required: boolean
  is_user_defined: boolean
  default_frontend_label: string
  frontend_labels: Array<{
    store_id: number
    label: string
  }>
  backend_type: string
  source_model: string | null
  default_value: string | null
  is_unique: string
  validation_rules: Array<{
    key: string
    value: string
  }>
  is_global: string
  is_visible: boolean
  is_searchable: string
  is_filterable: boolean
  is_comparable: string
  is_visible_on_front: string
  is_html_allowed_on_front: string
  is_used_for_price_rules: string
  is_filterable_in_search: string
  used_in_product_listing: string
  used_for_sort_by: string
  is_configurable: string
  apply_to: string[]
  is_visible_in_advanced_search: string
  position: number
  is_wysiwyg_enabled: string
  is_used_for_promo_rules: string
  is_required_in_admin_store: boolean
  is_used_in_grid: boolean
  is_visible_in_grid: boolean
  is_filterable_in_grid: boolean
  search_weight: number
  additional_data: string | null
}

export interface AttributeOptionsApiResponse {
  options: Array<{
    label: string
    value: string
    sort_order: number
    is_default: boolean
    store_labels: Array<{
      store_id: number
      label: string
    }>
  }>
}
