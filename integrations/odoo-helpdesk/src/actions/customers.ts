import * as bp from '.botpress'
import { print } from 'src/utils'
import axios from 'axios'
import { RuntimeError } from '@botpress/client'

export const createCustomer: bp.Integration['actions']['createCustomer'] = async (params) => {
  print(`Creating customer: ${JSON.stringify(params)}`)
  return {
    customer: undefined,
  }
}

export const fetchCustomer: bp.Integration['actions']['fetchCustomer'] = async (params) => {
  print(`Fetching customer: ${JSON.stringify(params)}`)
  return {
    customer: undefined,
  }
}

export const updateCustomer: bp.Integration['actions']['updateCustomer'] = async (params) => {
  print(`Updating customer: ${JSON.stringify(params)}`)
  return {
    success: false,
    error: 'Not implemented',
  }
}
