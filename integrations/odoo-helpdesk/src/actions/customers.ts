import * as bp from '.botpress'
import { RuntimeError } from '@botpress/client'
import { executeOdooMethod, getAuthenticatedCookie } from 'src/services/odoo'
import { customerSchema } from 'definitions/schemas/customer'
import { z } from '@botpress/sdk'

export const createCustomer: bp.Integration['actions']['createCustomer'] = async ({ ctx, input, logger }) => {
  logger.forBot().info(`Creating customer: ${JSON.stringify(input)}`)

  const cookie = await getAuthenticatedCookie({ ...ctx.configuration, logger })
  const { id, email, name, phone } = input

  const customerPayload: Record<string, any> = {
    email,
    phone,
    name,
  }

  const odooId = (await executeOdooMethod({
    odooApiUrl: ctx.configuration.odooApiUrl,
    cookie,
    model: 'res.partner',
    method: 'create',
    args: [customerPayload],
    logger,
  })) as number

  return {
    customer: {
      id,
      odooId: odooId.toString(),
      email,
      name,
      phone,
    },
  }
}

const fetchCustomer = async ({
  ctx,
  input,
  logger,
}: {
  ctx: bp.Context
  input: { id?: string; email?: string }
  logger: bp.Logger
}): Promise<{ customer: z.infer<typeof customerSchema> }> => {
  const { id, email } = input
  const cookie = await getAuthenticatedCookie({ ...ctx.configuration, logger })
  const fields = ['id', 'email', 'name', 'phone']

  let rawCustomer: Array<Record<string, any>>
  if (email) {
    rawCustomer = (await executeOdooMethod({
      odooApiUrl: ctx.configuration.odooApiUrl,
      cookie,
      model: 'res.partner',
      method: 'search_read',
      args: [[['email', '=', email]], fields],
      logger,
    })) as Array<Record<string, any>>
  } else if (id) {
    rawCustomer = (await executeOdooMethod({
      odooApiUrl: ctx.configuration.odooApiUrl,
      cookie,
      model: 'res.partner',
      method: 'read',
      args: [[id], fields],
      logger,
    })) as Array<Record<string, any>>
  } else {
    throw new RuntimeError('Must provide an id or email to fetch a customer')
  }

  if (rawCustomer.length === 0 || !rawCustomer[0]) {
    throw new RuntimeError('Customer not found')
  }
  if (rawCustomer.length > 1) {
    throw new RuntimeError('Multiple customers found for the same id')
  }

  const customer = rawCustomer[0]

  return {
    customer: {
      id,
      odooId: customer.id.toString(),
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
    } as z.infer<typeof customerSchema>,
  }
}
export const fetchCustomerById: bp.Integration['actions']['fetchCustomerById'] = async ({
  ctx,
  input,
  logger,
}) => {
  logger.forBot().info(`Fetching customer: ${JSON.stringify(input)}`)
  return fetchCustomer({ ctx, input, logger })
}
export const fetchCustomerByEmail: bp.Integration['actions']['fetchCustomerByEmail'] = async ({
  ctx,
  input,
  logger,
}) => {
  logger.forBot().info(`Fetching customer: ${JSON.stringify(input)}`)
  return fetchCustomer({ ctx, input, logger })
}

export const updateCustomer: bp.Integration['actions']['updateCustomer'] = async ({ ctx, input, logger }) => {
  logger.forBot().info(`Updating customer: ${JSON.stringify(input)}`)
  const cookie = await getAuthenticatedCookie({ ...ctx.configuration, logger })
  const { customer } = input
  const { id, email, name, phone } = customer

  const customerPayload: Record<string, any> = {
    email,
    phone,
    name,
  }

  // Convert string id to number for Odoo write operation
  const odooIdNumber = parseInt(id, 10)
  if (isNaN(odooIdNumber)) {
    throw new RuntimeError(`Invalid customer ID: ${id}`)
  }

  return {
    success: (await executeOdooMethod({
      odooApiUrl: ctx.configuration.odooApiUrl,
      cookie,
      model: 'res.partner',
      method: 'write',
      args: [[odooIdNumber], customerPayload],
      logger,
    })) as boolean,
  }
}
