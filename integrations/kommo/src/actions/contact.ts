import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'
import {KommoClient} from '../kommo-api/kommo-client'
import {CreateContactRequest, KommoContact} from '../kommo-api/types'
import {getErrorMessage} from '../kommo-api/error-handler'

//changed to botpress format

function mapKommoContactToBotpress(contact: KommoContact){
    return{
        id: contact.id,
        name: contact.name,
        firstName: contact.first_name,
        lastName: contact.last_name,
        responsibleUserId: contact.responsible_user_id,
        groupId: contact.group_id,
        updatedBy: contact.updated_by,
        createdAt: contact.created_at,
        updatedAt: contact.updated_at,
        closestTaskAt: contact.closest_task_at ?? undefined,
        isDeleted: contact.is_deleted,
        accountId: contact.account_id,
    }
}

export const createContact: bp.IntegrationProps['actions']['createContact'] = async ({
    ctx,
    input,
    logger,
}) => {
    try{
        logger.forBot().info("creating a contact with input", input)
        const{baseDomain, accessToken} = ctx.configuration

        if (!baseDomain || !accessToken){
            throw new sdk.RuntimeError('Missing baseDomain or accessToken in confguration')
        }
        const kommoClient = new KommoClient(accessToken, baseDomain, logger) 

        const contactData: CreateContactRequest = {
            name: input.name,
            first_name: input.firstName,
            last_name: input.lastName,
            responsible_user_id: input.responsibleUserId,
            created_by: input.createdBy,
            ...(input.updatedBy && { updated_by: input.updatedBy }),
        }

        logger.forBot().info('Contact data to send:', contactData)
        const kommoContact = await kommoClient.createContact(contactData)
        logger.forBot().info('Contact created successfully:', { contactId: kommoContact.id })
        return {
            contact: mapKommoContactToBotpress(kommoContact),
        }

    } catch (error){
        logger.forBot().error("failed to create contact", {error})
        throw new sdk.RuntimeError(getErrorMessage(error))
    }
}

export const getContact: bp.IntegrationProps['actions']['getContact'] = async ({
  ctx,
  input,
  logger,
}) => {
  try {
    logger.forBot().info('Getting contact:', { contactId: input.contactId })

    const { baseDomain, accessToken } = ctx.configuration

    const kommoClient = new KommoClient(accessToken, baseDomain, logger)
    const kommoContact = await kommoClient.getContact(input.contactId)

    if (!kommoContact) {
      logger.forBot().info('Contact not found:', { contactId: input.contactId })
      return { contact: undefined }
    }

    return {
      contact: mapKommoContactToBotpress(kommoContact),
    }
  } catch (error) {
    logger.forBot().error('Failed to get contact', { error })
    throw new sdk.RuntimeError(getErrorMessage(error))
  }
}