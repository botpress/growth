import * as bp from '.botpress'
import { print } from 'src/utils'
import axios from 'axios'
import { RuntimeError } from '@botpress/client'

export const createTicket: bp.Integration['actions']['createTicket'] = async (params) => {
  print(`Creating ticket: ${JSON.stringify(params)}`)
  return {
    odooTicket: undefined,
  }
}

export const fetchTicket: bp.Integration['actions']['fetchTicket'] = async (params) => {
  print(`Fetching ticket: ${JSON.stringify(params)}`)
  return {
    odooTicket: undefined,
  }
}

export const fetchTickets: bp.Integration['actions']['fetchTickets'] = async (params) => {
  print(`Fetching tickets: ${JSON.stringify(params)}`)
  return {
    odooTickets: [],
  }
}

export const updateTicket: bp.Integration['actions']['updateTicket'] = async (params) => {
  print(`Updating ticket: ${JSON.stringify(params)}`)
  return {
    success: false,
    error: 'Not implemented',
  }
}

export const closeTicket: bp.Integration['actions']['closeTicket'] = async (params) => {
  print(`Closing ticket: ${JSON.stringify(params)}`)
  return {
    success: false,
    error: 'Not implemented',
  }
}
