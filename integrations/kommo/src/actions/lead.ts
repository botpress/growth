import * as sdk from '@botpress/sdk'
import { KommoClient } from '../kommo-api/kommo-client'
import { CreateLeadRequest, UpdateLeadRequest, KommoLead } from '../kommo-api/types'

// mapping kommo to loval schema
function mapKommoLeadToBotpress(lead: KommoLead) {
  return {
    id: lead.id,
    name: lead.name,
    price: lead.price,
    responsibleUserId: lead.responsible_user_id,
    pipelineId: lead.pipeline_id,
    statusId: lead.status_id,
    createdAt: lead.created_at,
    updatedAt: lead.updated_at,
  }
}

// create lead handler
export const createLead = async ({
  ctx,
  input,
  logger,
}: any) => {
  try {
    logger.forBot().info('Creating lead with input:', input)
    logger.forBot().info('Configuration:', { baseDomain: ctx.configuration.baseDomain })

    const { baseDomain, accessToken } = ctx.configuration

    if (!baseDomain || !accessToken) {
      throw new Error('Missing baseDomain or accessToken in configuration')
    }

    // Initialize Kommo API client
    const kommoClient = new KommoClient(accessToken, baseDomain, logger)

    // Prepare the request data
    // Only include optional fields if they have valid (non-zero) values
    const leadData: CreateLeadRequest = {
      name: input.name,
      ...(input.price && input.price > 0 && { price: input.price }),
      ...(input.responsibleUserId && input.responsibleUserId > 0 && { responsible_user_id: input.responsibleUserId }),
      ...(input.pipelineId && input.pipelineId > 0 && { pipeline_id: input.pipelineId }),
      ...(input.statusId && input.statusId > 0 && { status_id: input.statusId }),
    }

    logger.forBot().info('Lead data to send:', leadData)

    // Create the lead in Kommo
    const kommoLead = await kommoClient.createLead(leadData)

    logger.forBot().info('Lead created successfully:', { leadId: kommoLead.id })

    // Map to Botpress schema and return
    return {
      lead: mapKommoLeadToBotpress(kommoLead),
    }
  } catch (error: any) {
    logger.forBot().error('Error creating lead:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status,
    })
    throw new sdk.RuntimeError(`${error.message}`)
  }
}

// get lead handler
export const getLead = async ({
  ctx,
  input,
  logger,
}: any) => {
  try {
    logger.forBot().info('Getting lead:', { leadId: input.leadId })

    const { baseDomain, accessToken } = ctx.configuration

    const kommoClient = new KommoClient(accessToken, baseDomain, logger)
    const kommoLead = await kommoClient.getLead(input.leadId)

    if (!kommoLead) {
      logger.forBot().info('Lead not found:', { leadId: input.leadId })
      return { lead: undefined }
    }

    return {
      lead: mapKommoLeadToBotpress(kommoLead),
    }
  } catch (error: any) {
    logger.forBot().error('Error getting lead:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
    })
    throw new sdk.RuntimeError(`Failed to get lead: ${error.message}`)
  }
}

// handler for updating lead
export const updateLead = async ({
  ctx,
  input,
  logger,
}: any) => {
  try {
    logger.forBot().info('Updating lead:', input)

    const { baseDomain, accessToken } = ctx.configuration
    const kommoClient = new KommoClient(accessToken, baseDomain, logger)

    // Prepare the update data - only include fields that are provided
    const updateData: UpdateLeadRequest = {
      ...(input.name && { name: input.name }),
      ...(input.price !== undefined && input.price >= 0 && { price: input.price }),
      ...(input.responsibleUserId && input.responsibleUserId > 0 && { responsible_user_id: input.responsibleUserId }),
      ...(input.pipelineId && input.pipelineId > 0 && { pipeline_id: input.pipelineId }),
      ...(input.statusId && input.statusId > 0 && { status_id: input.statusId }),
    }

    logger.forBot().info('Update data to send:', updateData)

    // Update the lead in Kommo
    const kommoLead = await kommoClient.updateLead(input.leadId, updateData)

    logger.forBot().info('Lead updated successfully:', { leadId: kommoLead.id })

    // Map to botpress schema and return
    return {
      lead: mapKommoLeadToBotpress(kommoLead),
    }
  } catch (error: any) {
    logger.forBot().error('Error updating lead:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status,
    })
    throw new sdk.RuntimeError(`Failed to update lead: ${error.message}`)
  }
}

// moves lead tgouth pipeline stage( )
export const moveLead = async ({
  ctx,
  input,
  logger,
}: any) => {
  try {
    logger.forBot().info('Moving lead:', input)

    const { baseDomain, accessToken } = ctx.configuration
    const kommoClient = new KommoClient(accessToken, baseDomain, logger)

    // Kommo move requires PATCH request - we need to implement this
    throw new sdk.RuntimeError('Move lead not yet implemented')
  } catch (error: any) {
    logger.forBot().error('Error moving lead:', {
      message: error.message,
      stack: error.stack,
    })
    throw new sdk.RuntimeError(`Failed to move lead: ${error.message}`)
  }
}
