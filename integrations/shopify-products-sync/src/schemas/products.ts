export type ShopifyProduct = {
  id: number
  title: string
  body_html?: string
  vendor?: string
  product_type?: string
  created_at?: string
  handle?: string
  updated_at?: string
  published_at?: string
  template_suffix?: string
  status?: string
  published_scope?: string
  tags?: string
  admin_graphql_api_id?: string
  variants?: any[]
  options?: any[]
  images?: { src: string }[]
  image?: { src: string }
  media?: any[]
  variant_gids?: string[]
  has_variants_that_requires_components?: boolean
  category?: string
}

export type StoredProduct = {
  id: number;
  title: string;
  description: string; // from "body_html"
  vendor: string;
  tags?: string;
  productType?: string;
  price: string;
  weight: number; // in weightUnit
  weightUnit: string; // e.g., "oz"
  images: string[]; // list of image URLs
  options?: string[]; // e.g., sizes, colors
  url: string;
}

export const PRODUCT_TABLE_SCHEMA = {
  type: 'object',
  properties: {
    product_id: { type: 'number', 'x-zui': { searchable: false }  },
    aggregate: { type: 'string', 'x-zui': { searchable: true }  },
  },
  required: ['product_id', 'aggregate'],
}