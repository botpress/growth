import { z } from '@botpress/sdk'

export const productCreatedSchema = z.object({
  admin_graphql_api_id: z.string(),
  body_html: z.string(),
  created_at: z.string().nullable(),
  handle: z.string(),
  id: z.number(),
  product_type: z.string(),
  published_at: z.string(),
  template_suffix: z.string().nullable(),
  title: z.string(),
  updated_at: z.string(),
  vendor: z.string(),
  status: z.string(),
  published_scope: z.string(),
  tags: z.string(),
  variants: z.array(z.object({
    admin_graphql_api_id: z.string(),
    barcode: z.string().nullable(),
    compare_at_price: z.string().nullable(),
    created_at: z.string(),
    id: z.number(),
    inventory_policy: z.string(),
    position: z.number(),
    price: z.string(),
    product_id: z.number(),
    sku: z.string().nullable(),
    taxable: z.boolean(),
    title: z.string(),
    updated_at: z.string(),
    option1: z.string().nullable(),
    option2: z.string().nullable(),
    option3: z.string().nullable(),
    image_id: z.number().nullable(),
    inventory_item_id: z.number().nullable(),
    inventory_quantity: z.number(),
    old_inventory_quantity: z.number(),
  })),
  options: z.array(z.any()),
  images: z.array(z.any()),
  image: z.any().nullable(),
  media: z.array(z.any()),
  variant_gids: z.array(z.object({
    admin_graphql_api_id: z.string(),
    updated_at: z.string(),
  })),
  has_variants_that_requires_components: z.boolean(),
  category: z.string().nullable(),
})

export const productDeletedSchema = z.object({
  id: z.number(),
})

export const productUpdatedSchema = productCreatedSchema

