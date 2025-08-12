import { Integration } from '../../.botpress'
import { productCreatedSchema, productDeletedSchema, productUpdatedSchema } from 'src/schemas/events'
import { buildProduct } from 'src/misc/shopify-products'
import { createTableRow, deleteTableRow, updateTableRow, ensureTableExists } from 'src/misc/table'

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
      
      // Update Table
      try {
        await ensureTableExists(client, ctx.configuration.rowStorageFactor || 1)
        await createTableRow(client, product, ctx.configuration.shopDomain, ctx.configuration.rowStorageFactor || 1, logger)
        logger.forBot().info(`Successfully created table row for product ${product.id}`)
      } catch (error) {
        logger.forBot().error(`Error creating table row for product ${product.id}: ${error}`)
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

      // Delete from Table
      try {
        await deleteTableRow(client, payload.id, logger)
        logger.forBot().info(`Successfully deleted table row for product ${payload.id}`)
      } catch (error) {
        logger.forBot().error(`Error deleting table row for product ${payload.id}: ${error}`)
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

      // Update Table
      try {
        await ensureTableExists(client, ctx.configuration.rowStorageFactor || 1)
        await updateTableRow(client, product, ctx.configuration.shopDomain, ctx.configuration.rowStorageFactor || 1, logger)
        logger.forBot().info(`Successfully updated table row for product ${product.id}`)
      } catch (error) {
        logger.forBot().error(`Error updating table row for product ${product.id}: ${error}`)
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

