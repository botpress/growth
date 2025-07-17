import { Integration } from '../../.botpress'
import { productCreatedSchema, productDeletedSchema, productUpdatedSchema } from 'src/schemas/events'
import { deleteKbArticleById, getUploadArticlePayload } from 'src/misc/kb'
import { buildProduct } from 'src/misc/shopify-products'

type Implementation = ConstructorParameters<typeof Integration>[0]
type HandlerFunction = Implementation['handler']

export const handler: HandlerFunction = async ({ req, logger, client, ctx }) => {
  try {
    if (!req.body) {
      logger.forBot().error(`Request body is missing. Bot: ${ctx.botId}, Integration: ${ctx.integrationId}. The incoming request did not contain a body. Request details: ${JSON.stringify(req)}`);
      return;
    }
    
    const body = JSON.parse(req.body);

    if (req.headers['x-shopify-topic'] === 'products/create') {
      const product = buildProduct(body)
      
      try {
        await deleteKbArticleById(ctx.configuration.knowledgeBaseId, body.id, client)
        const payload = getUploadArticlePayload({ kbId: ctx.configuration.knowledgeBaseId, product, shopDomain: ctx.configuration.shopDomain })
        
        await client.uploadFile(payload)
      } catch (error) {
        logger.forBot().error(`Error creating new row for product ${product.id}: ${error}`)
      }
      
      let parsedPayload = productCreatedSchema.parse(product)

      try {
        await client.createEvent({
          type: 'productCreated',
          payload: parsedPayload
        })
      } catch (error) {
        logger.forBot().error(`Error creating productCreated event for product ${product.id}: ${error}`)
      }
    }

    if (req.headers['x-shopify-topic'] === 'products/delete') {
      const payload = { id: body.id }

      try {
        await deleteKbArticleById(ctx.configuration.knowledgeBaseId, payload.id, client)
      } catch (error) {
        logger.forBot().error(`Error deleting row for product ${payload.id}: ${error}`)
      }

      let parsedPayload = productDeletedSchema.parse(payload)

      try {
        await client.createEvent({
          type: 'productDeleted',
          payload: parsedPayload
        })
      } catch (error) {
        logger.forBot().error(`Error creating productDeleted event for product ${payload.id}: ${error}`)
      }
    }

    if (req.headers['x-shopify-topic'] === 'products/update') {

      const product = buildProduct(body)
    
      try {
        await deleteKbArticleById(ctx.configuration.knowledgeBaseId, body.id, client)
        const payload = getUploadArticlePayload({ kbId: ctx.configuration.knowledgeBaseId, product, shopDomain: ctx.configuration.shopDomain })
      
        await client.uploadFile(payload)
      } catch (error) {
        logger.forBot().error(`Error creating new row for product ${product.id}: ${error}`)
      }

      let parsedPayload = productUpdatedSchema.parse(product)

      try {
        await client.createEvent({
          type: 'productUpdated',
          payload: parsedPayload
        })
      } catch (error) {
        logger.forBot().error(`Error creating productUpdated event for product ${product.id}: ${error}`)
      }
    }
  } catch (error) {
    logger.forBot().error(`Unexpected error in handler: ${error}`)
  }
}

