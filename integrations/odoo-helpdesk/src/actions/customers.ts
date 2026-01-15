import * as bp from '.botpress'
import axios from 'axios'
import { RuntimeError } from '@botpress/client'

export const createCustomer: bp.Integration['actions']['createCustomer'] = async ({ ctx, input, logger }) => {

  logger.forBot().info(`Creating customer: ${JSON.stringify(input)}`)

  return {
    customer: undefined,
  }
}

export const fetchCustomer: bp.Integration['actions']['fetchCustomer'] = async ({ ctx, input, logger }) => {
  logger.forBot().info(`Fetching customer: ${JSON.stringify(input)}`)
  return {
    customer: undefined,
  }
}

export const updateCustomer: bp.Integration['actions']['updateCustomer'] = async ({ ctx, input, logger }) => {
  logger.forBot().info(`Updating customer: ${JSON.stringify(input)}`)
  return {
    success: false,
    error: 'Not implemented',
  }
}
