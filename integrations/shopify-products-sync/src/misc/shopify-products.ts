import * as bp from '.botpress'
import { ShopifyClient } from '../client'
import { ShopifyProduct } from '../schemas/products'
import { stripHtmlTags } from './utils'

export async function fetchAllProducts(shopifyClient: ShopifyClient, logger: bp.Logger) {
  const allProducts: ShopifyProduct[] = []
  const limit = 250
  let hasMore = true
  let sinceId: number | undefined = undefined

  while (hasMore) {
    const params: Record<string, any> = { limit, published_status: 'published' }
    if (sinceId) params.since_id = sinceId
    const products = await shopifyClient.getProducts(logger, params)
    allProducts.push(...products)
    hasMore = products.length === limit
    if (hasMore && products && products.length > 0) {
      sinceId = products[products.length - 1]?.id
    }
  }

  return allProducts
}

export function buildProduct(body: any): ShopifyProduct {
  return {
    id: body.id,
    title: body.title,
    body_html: stripHtmlTags(body.body_html) || '',
    vendor: body.vendor,
    product_type: body.product_type,
    created_at: body.created_at,
    handle: body.handle,
    updated_at: body.updated_at,
    published_at: body.published_at,
    template_suffix: body.template_suffix,
    status: body.status,
    published_scope: body.published_scope,
    tags: body.tags,
    admin_graphql_api_id: body.admin_graphql_api_id,
    variants: body.variants,
    options: body.options,
    images: body.images,
    image: body.image,
    media: body.media,
    variant_gids: body.variant_gids,
    has_variants_that_requires_components: body.has_variants_that_requires_components
      ? body.has_variants_that_requires_components
      : false,
    category: body.category ? body.category : null,
  }
}
