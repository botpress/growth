import * as bp from '.botpress'
import { ShopifyProduct, StoredProduct } from '../schemas/products'
import { stripHtmlTags } from './utils'

export const deleteKbArticles = async (kbId: string, client: bp.Client): Promise<void> => {
  const { files } = await client.listFiles({
    tags: {
      kbId,
    },
  })

  for (const file of files) {
    if (file.tags.origin === 'shopify') {
      await client.deleteFile({ id: file.id })
    }
  }
}

export const deleteKbArticleById = async (kbId: string, id: string, client: bp.Client): Promise<void> => {
  const { files } = await client.listFiles({
    tags: {
      kbId,
    },
  })
  for (const file of files) {
    if (file.tags.productId == id) {
      await client.deleteFile({ id: file.id })
    }
  }
}

export const getUploadArticlePayload = ({
  kbId,
  product,
  shopDomain,
}: {
  kbId: string
  product: ShopifyProduct
  shopDomain: string
}) => {
  const storedProduct: StoredProduct = {
    id: product.id,
    title: product.title,
    description: product.body_html || 'N/A',
    vendor: product.vendor || 'N/A',
    tags: product.tags || 'N/A',
    productType: product.product_type || 'N/A',
    price: (product.variants && product.variants[0].price) || 'N/A',
    weight: (product.variants && product.variants[0].weight) || 0,
    weightUnit: (product.variants && product.variants[0].weight_unit) || 'N/A',
    images: (product.images && product.images.map((image) => image.src)) || [],
    options: product.options || [],
    url: `https://${shopDomain}/products/${product.handle}`,
  }

  // Sanitize product title for use as filename
  const sanitizedTitle = product.title
    .replace(/[/\\?%*:|"<>]/g, '-') // Replace invalid filename characters with hyphens
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .trim()

  return {
    key: `${sanitizedTitle}.txt`,
    accessPolicies: [],
    content: stripHtmlTags(JSON.stringify(storedProduct)),
    index: true,
    tags: {
      source: 'knowledge-base',
      kbId,
      productId: product.id.toString(),
      origin: 'shopify',
    },
  }
}
