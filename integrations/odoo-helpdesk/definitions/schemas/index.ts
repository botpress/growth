import { z } from '@botpress/sdk'
import { AuthPayloadBody, AuthHeaders, AuthResponse, Cookie } from './authentication'
import {
  customerSchema,
  createCustomerPayloadSchema,
  createCustomerResultSchema,
  fetchCustomerResultSchema,
  updateCustomerPayloadSchema,
  Customer,
  CreateCustomerPayload,
  CreateCustomerResult,
  FetchCustomerResult,
  UpdateCustomerPayload,
} from './customer'
import {
  helpdeskTeamSchema,
  fetchHelpdeskTeamResultsSchema,
  HelpdeskTeam,
  FetchHelpdeskTeamResults,
} from './helpdesk-team'
import { stageSchema, fetchStagesResultsSchema, Stage, FetchStagesResults } from './stage'
import {
  ticketSchema,
  createTicketResultSchema,
  createTicketPayloadSchema,
  fetchTicketResultSchema,
  fetchTicketResultsSchema,
  updateTicketPayloadSchema,
  Ticket,
  CreateTicketPayload,
  FetchTicketResult,
  FetchTicketResults,
  UpdateTicketPayload,
  CreateTicketResult,
} from './ticket'
import {
  odooRequestFilterSchema,
  odooRequestFiltersSchema,
  odooRequestFieldsSchema,
  odooRequestKwargsSchema,
  OdooRequestModel,
  OdooRequestMethod,
  OdooRequestFilters,
  OdooRequestFields,
  OdooRequestKwargs,
  OdooResponseFruitfulObject,
  OdooResponseObject,
} from './odoo'

// Args schema accepts filter elements plus all payload schemas
const odooRequestArgsSchema = z
  .union([
    z
      .tuple([
        z.union([odooRequestFilterSchema, odooRequestFiltersSchema]),
        z.union([updateCustomerPayloadSchema, updateTicketPayloadSchema, odooRequestFieldsSchema]),
      ])
      .describe('The filters and fields/payload to pass to the Odoo request'),
    z.tuple([
      z
        .union([createCustomerPayloadSchema, createTicketPayloadSchema])
        .describe('The payload to pass to the Odoo request'),
    ]),
  ])
  .describe('The arguments to pass to the Odoo request')

type OdooRequestArgs = z.infer<typeof odooRequestArgsSchema>

export {
  customerSchema,
  createCustomerPayloadSchema,
  createCustomerResultSchema,
  fetchCustomerResultSchema,
  updateCustomerPayloadSchema,
  helpdeskTeamSchema,
  fetchHelpdeskTeamResultsSchema,
  odooRequestFilterSchema,
  odooRequestFiltersSchema,
  odooRequestFieldsSchema,
  odooRequestKwargsSchema,
  stageSchema,
  fetchStagesResultsSchema,
  ticketSchema,
  createTicketPayloadSchema,
  createTicketResultSchema,
  fetchTicketResultSchema,
  fetchTicketResultsSchema,
  AuthPayloadBody,
  AuthHeaders,
  AuthResponse,
  Cookie,
  Customer,
  CreateCustomerPayload,
  CreateCustomerResult,
  FetchCustomerResult,
  UpdateCustomerPayload,
  HelpdeskTeam,
  FetchHelpdeskTeamResults,
  OdooRequestModel,
  OdooRequestMethod,
  OdooRequestFilters,
  OdooRequestFields,
  OdooRequestKwargs,
  OdooRequestArgs,
  OdooResponseFruitfulObject,
  OdooResponseObject,
  Stage,
  FetchStagesResults,
  Ticket,
  CreateTicketPayload,
  FetchTicketResult,
  FetchTicketResults,
  UpdateTicketPayload,
  CreateTicketResult,
}
