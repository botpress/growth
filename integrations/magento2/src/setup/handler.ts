import * as bp from '.botpress'
import { executeSyncProducts } from '../actions'

export const handler: bp.IntegrationProps['handler'] = async ({ req, logger, ctx }) => {
  if (req.method !== 'POST') {
    return {
      status: 405,
      body: JSON.stringify({
        success: false,
        message: 'Method not allowed',
      }),
    }
  }

  try {
    const webhookData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body

    const eventType = webhookData?.event || webhookData?.type || webhookData?.data?.type

    if (eventType === 'magentoSyncContinue') {
      logger.forBot().info('Magento sync continue event received')

      try {
        const data = webhookData.data || webhookData

        const {
          table_name,
          custom_columns_to_add_to_table,
          filters_json,
          retrieve_reviews,
          _currentPage,
          _totalCount,
          _tableId,
          _runId,
          _customAttributeCodes,
          _attributeMappings,
          _filterCriteria,
          _currentPageProductIndex,
        } = data

        const result = await executeSyncProducts({
          ctx,
          input: {
            table_name,
            custom_columns_to_add_to_table,
            filters_json,
            retrieve_reviews,
            _currentPage,
            _totalCount,
            _tableId,
            _runId,
            _customAttributeCodes,
            _attributeMappings,
            _filterCriteria,
            _currentPageProductIndex,
          },
          logger,
        })

        logger.forBot().info('Sync continuation completed')

        return {
          status: 200,
          body: JSON.stringify({
            success: true,
            message: 'Background processing completed successfully',
            result,
          }),
        }
      } catch (error) {
        logger.forBot().error(`Error continuing product sync: ${error}`)
        return {
          status: 500,
          body: JSON.stringify({
            success: false,
            message: `Background processing failed: ${error instanceof Error ? error.message : String(error)}`,
          }),
        }
      }
    } else {
      logger.forBot().warn(`Unhandled webhook event type: ${eventType || 'unknown'}`)
      return {
        status: 200,
        body: JSON.stringify({
          success: true,
          message: 'Webhook received but not processed',
        }),
      }
    }
  } catch (error) {
    logger.forBot().error(`Unexpected error in handler: ${error}`)
    return {
      status: 500,
      body: JSON.stringify({
        success: false,
        message: `Error handling webhook: ${error instanceof Error ? error.message : String(error)}`,
      }),
    }
  }
}
