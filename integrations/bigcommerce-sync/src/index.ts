import actions from './actions'
import * as bp from '.botpress'
import { Client } from '@botpress/client'
import { getBigCommerceClient } from './client'
import { productsTableSchema, productsTableName } from './schemas/products'

/*
FOR FUTURE PURPOSES:
This is the client that MUST be imported in order to allow table operations
within an integration. Without this, the table operations will cause errors everywhere.
*/
const getVanillaClient = (client: any): Client => 
  (client as any)._client as Client

export default new bp.Integration({
  register: async ({ client, ctx, logger }) => {
    logger.forBot().info('Registering BigCommerce integration')
    
    try {
      const vanillaClient = getVanillaClient(client)
      
      await vanillaClient.getOrCreateTable({
        table: productsTableName,
        schema: productsTableSchema,
      })
      
      logger.forBot().info('Syncing BigCommerce products...')
      
      try {
        const syncResult = await actions.syncProducts({
          ctx,
          client,
          logger,
          input: {},
        });
        
        logger.forBot().info(`Product sync completed: ${syncResult.message}`);
        
        if (ctx.webhookId) {
          const webhookUrl = `https://webhook.botpress.cloud/${ctx.webhookId}`;
          logger.forBot().info(`Setting up BigCommerce webhooks to: ${webhookUrl}`)
          try {
            const bigCommerceClient = getBigCommerceClient(ctx.configuration)
            const webhookResults = await bigCommerceClient.createProductWebhooks(webhookUrl)
            logger.forBot().info('Webhook creation results:', webhookResults)
          } catch (webhookError) {
            logger.forBot().error('Error creating webhooks:', webhookError)
          }
        }
      } catch (syncError) {
        logger.forBot().error('Error syncing products during initialization', syncError)
      }
      
      logger.forBot().info('BigCommerce integration registered successfully')
    } catch (error) {
      logger.forBot().error('Error registering BigCommerce integration', error)
    }
  },
  unregister: async () => {},
  actions,
  channels: {},
  handler: async ({ req, client, ctx, logger }) => {
    if (req.method === 'POST') {
      logger.forBot().info('Received webhook from BigCommerce')
      
      try {
        logger.forBot().info('Webhook headers:', JSON.stringify(req.headers))
        
        const isBigCommerceWebhook = 
          (req.headers['webhook-id'] && req.headers['webhook-signature'] && req.headers['webhook-timestamp']) ||
          Object.keys(req.headers).some(key => 
            key.toLowerCase().includes('bigcommerce') || 
            key.toLowerCase().includes('bc-webhook')
          );
        
        logger.forBot().info(`Is BigCommerce webhook based on headers: ${isBigCommerceWebhook}`);
        
        if (isBigCommerceWebhook) {
          const webhookData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          logger.forBot().info('Webhook data:', JSON.stringify(webhookData));
          
          const vanillaClient = getVanillaClient(client);
          const tableName = productsTableName;
          const bigCommerceClient = getBigCommerceClient(ctx.configuration);
          
          logger.forBot().info('Webhook data structure:', JSON.stringify({
            hasData: !!webhookData?.data,
            dataType: webhookData?.data ? typeof webhookData.data : 'undefined',
            dataKeys: webhookData?.data ? Object.keys(webhookData.data) : [],
            hasScope: !!webhookData?.scope,
            scope: webhookData?.scope
          }));
          
          let scope = webhookData?.scope;
          
          // If no scope in main object, check if it's in the headers
          // Why does BigCommerce send the event type in the X-Webhook-Event header? (idk i guess we'll never know)
          if (!scope && req.headers['x-webhook-event']) {
            scope = req.headers['x-webhook-event'];
          }
          
          // Attempt to extract product ID using different possible paths
          let productId;
          if (webhookData?.data?.id) {
            productId = webhookData.data.id;
          } else if (webhookData?.data?.entity_id) {
            productId = webhookData.data.entity_id;
          } else if (webhookData?.id) {
            productId = webhookData.id;
          }
          
          logger.forBot().info(`Processing event: ${scope} for product ID: ${productId}`);
          
          if (scope && productId) {
            // Normalize scope string to handle potential format variations
            const normalizedScope = scope.toLowerCase();
            const isCreated = normalizedScope.includes('created') || normalizedScope.includes('create');
            const isUpdated = normalizedScope.includes('updated') || normalizedScope.includes('update');
            const isDeleted = normalizedScope.includes('deleted') || normalizedScope.includes('delete');
            
            if (isCreated || isUpdated) {
              // For product creation or update, fetch only the specific product
              logger.forBot().info(`Fetching product details for ID: ${productId}`);
              
              try {
                const productResponse = await bigCommerceClient.getProduct(productId.toString());
                const product = productResponse.data;
                
                if (product) {
                  const categories = product.categories?.join(',') || '';
                  const imageUrl = product.images && product.images.length > 0 
                    ? product.images[0].url_standard 
                    : '';
                    
                  const productRow = {
                    product_id: product.id,
                    name: product.name,
                    sku: product.sku,
                    price: product.price,
                    sale_price: product.sale_price,
                    retail_price: product.retail_price,
                    cost_price: product.cost_price,
                    weight: product.weight,
                    type: product.type,
                    inventory_level: product.inventory_level,
                    inventory_tracking: product.inventory_tracking,
                    brand_id: product.brand_id,
                    categories: categories,
                    availability: product.availability,
                    condition: product.condition,
                    is_visible: product.is_visible,
                    sort_order: product.sort_order,
                    description: product.description?.substring(0, 1000) || '',
                    image_url: imageUrl,
                    url: product.custom_url?.url || '',
                  };
                  
                  // Check if the product already exists in our table
                  const { rows } = await vanillaClient.findTableRows({
                    table: tableName,
                    filter: { product_id: product.id },
                  });
                  
                  if (rows.length > 0 && rows[0]?.id) {
                    // Update existing product
                    logger.forBot().info(`Updating existing product ID: ${productId}`);
                    await vanillaClient.updateTableRows({
                      table: tableName,
                      rows: [{ id: rows[0].id, ...productRow }],
                    });
                  } else {
                    // Insert new product
                    logger.forBot().info(`Creating new product ID: ${productId}`);
                    await vanillaClient.createTableRows({
                      table: tableName,
                      rows: [productRow],
                    });
                  }
                  
                  return {
                    status: 200,
                    body: JSON.stringify({
                      success: true,
                      message: `Product ${productId} ${isCreated ? 'created' : 'updated'} successfully`,
                    })
                  };
                }
              } catch (error) {
                logger.forBot().error(`Error processing ${scope} for product ${productId}:`, error);
                throw error;
              }
            } else if (isDeleted) {
              // For product deletion, remove just the specific product
              logger.forBot().info(`Deleting product ID: ${productId}`);
              
              try {
                // Find the product in our table
                const { rows } = await vanillaClient.findTableRows({
                  table: tableName,
                  filter: { product_id: productId },
                });
                
                if (rows.length > 0 && rows[0]?.id) {
                  // Delete the product
                  await vanillaClient.deleteTableRows({
                    table: tableName,
                    ids: [rows[0].id],
                  });
                  
                  return {
                    status: 200,
                    body: JSON.stringify({
                      success: true,
                      message: `Product ${productId} deleted successfully`,
                    })
                  };
                } else {
                  logger.forBot().warn(`Product ID ${productId} not found for deletion`);
                  return {
                    status: 200,
                    body: JSON.stringify({
                      success: true,
                      message: `Product ${productId} not found for deletion`,
                    })
                  };
                }
              } catch (error) {
                logger.forBot().error(`Error deleting product ${productId}:`, error);
                throw error;
              }
            }
          } else {
            // If we can't extract the product ID or event type, fall back to full sync (literal deletion-insertion sync)
            logger.forBot().warn('Could not extract product ID or event type from webhook, falling back to full sync');
            
            logger.forBot().info('Detailed webhook structure for debugging:', {
              bodyType: typeof req.body,
              bodyKeys: typeof req.body === 'object' ? Object.keys(req.body) : [],
              headerKeys: Object.keys(req.headers),
              hasProductId: !!productId,
              hasScope: !!scope,
              payloadSample: JSON.stringify(webhookData).substring(0, 500)
            });
            
            const result = await actions.syncProducts({
              ctx,
              client,
              logger,
              input: {},
            });
            
            return {
              status: 200,
              body: JSON.stringify({
                success: result.success,
                message: 'Full sync performed (fallback)',
                syncResult: result
              })
            };
          }
        } else {
          // Inderterminate webhook, fall back to full sync
          logger.forBot().warn('Not a recognized BigCommerce webhook, falling back to full sync');
          const result = await actions.syncProducts({
            ctx,
            client,
            logger,
            input: {},
          });
          
          return {
            status: 200,
            body: JSON.stringify({
              success: result.success,
              message: 'BigCommerce webhook processed (full sync)',
              syncResult: result
            })
          };
        }
      } catch (error) {
        logger.forBot().error('Error processing webhook:', error)
        return {
          status: 500,
          body: JSON.stringify({
            success: false, 
            message: `Error processing webhook: ${error instanceof Error ? error.message : String(error)}`
          })
        }
      }
    }
    
    return {
      status: 405,
      body: JSON.stringify({
        success: false, 
        message: 'Method not allowed'
      })
    }
  },
}) 