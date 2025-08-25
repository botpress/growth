export interface MagentoConfiguration {
  magento_domain: string;
  consumer_key: string;
  consumer_secret: string;
  access_token: string;
  access_token_secret: string;
  botpress_pat: string;
  user_agent?: string;
  store_code?: string;
}

export interface SyncInput {
  table_name: string;
  custom_columns_to_add_to_table?: string;
  filters_json?: string;
  retrieve_reviews?: boolean;
  _currentPage?: number;
  _totalCount?: number;
  _tableId?: string;
  _runId?: string;
  _customAttributeCodes?: string[];
  _attributeMappings?: string | Record<string, Record<string, string>>;
  _columnNameMappings?: string;
  _filterCriteria?: string;
  _currentPageProductIndex?: number;
}

export interface Filter {
  field: string;
  condition: string;
  value?: string | number;
}

export interface AttributeMapping {
  [attributeCode: string]: {
    [value: string]: string;
  };
}

export interface ColumnNameMapping {
  [shortName: string]: string;
}

export interface ProcessProductsConfig {
  logger: any;
  magento_domain: string;
  oauth: OAuthClient;
  token: OAuthToken;
  headers: Record<string, string>;
  availableColumns: string[];
  customAttributeCodes: string[];
  attributeMappings: AttributeMapping;
  columnNameMappings: ColumnNameMapping;
  tableSchema: TableSchema;
  store_code: string;
  retrieve_reviews?: boolean;
}

export interface SyncResult {
  success: boolean;
  synced_count: number;
  total_count: number;
  table_name: string;
  status: string;
  error?: string;
}

export interface ProductRow {
  [columnName: string]: string | number | boolean | null;
}

export interface SyncState {
  tableId: string;
  tableSchema: TableSchema | null;
  customAttributeCodes: string[];
  filterCriteria: string;
  attributeMappings: AttributeMapping;
  columnNameMappings: ColumnNameMapping;
}

export interface BotpressContext {
  configuration: MagentoConfiguration;
  botId: string;
  webhookId?: string;
}

// OAuth interfaces
import OAuth from "oauth-1.0a";

export type OAuthClient = OAuth;
export type OAuthToken = OAuth.Token;

// Product interfaces
export interface MagentoProduct {
  sku: string;
  name: string;
  price: number;
  custom_attributes?: CustomAttribute[];
  extension_attributes?: {
    stock_item?: {
      qty: number;
      is_in_stock: boolean;
    };
  };
  media_gallery_entries?: MediaGalleryEntry[];
}

export interface CustomAttribute {
  attribute_code: string;
  value: string | number | boolean | Array<string | number>;
}

export interface MediaGalleryEntry {
  file: string;
}

// Stock interfaces
export interface StockItem {
  qty: number;
  is_in_stock: boolean;
}

// Review interfaces
export interface Review {
  ratings: ReviewRating[];
}

export interface ReviewRating {
  value: string;
}

// Table schema interfaces
export interface TableSchema {
  type: string;
  properties: Record<string, TableProperty>;
}

export interface TableProperty {
  type: string;
}

// Sync context interface
export interface SyncContext {
  config: MagentoConfiguration;
  oauth: OAuthClient;
  token: OAuthToken;
  headers: Record<string, string>;
  httpHeaders: Record<string, string>;
  apiBaseUrl: string;
  webhookId?: string;
}

// Product processing interfaces
export interface ProductProcessingContext {
  logger: any;
  magento_domain: string;
  oauth: OAuthClient;
  token: OAuthToken;
  headers: Record<string, string>;
  store_code: string;
}

// API response interfaces
export interface ProductsResponse {
  items: MagentoProduct[];
  total_count: number;
}

export interface AttributeOptionsResponse {
  options: AttributeOption[];
}

export interface AttributeOption {
  label: string;
  value: string;
}
