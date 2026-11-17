import { z } from '@botpress/sdk'
import {
  AuthPayloadBody,
  AuthHeaders,
  AuthResponseHeaders,
  Cookie,
  AuthResponseData,
  authResponseDataSchema,
} from './authentication'
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
  odooApiResponseSchema,
  OdooRequestModel,
  OdooRequestMethod,
  OdooRequestFilters,
  OdooRequestFields,
  OdooRequestKwargs,
  OdooResponseFruitfulObject,
  OdooResponseObject,
  OdooApiResponse,
} from './odoo'

/**
 * Args schema accepts filter elements plus all payload schemas.
 */
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
  odooApiResponseSchema,
  stageSchema,
  fetchStagesResultsSchema,
  ticketSchema,
  createTicketPayloadSchema,
  createTicketResultSchema,
  fetchTicketResultSchema,
  fetchTicketResultsSchema,
  authResponseDataSchema,
  AuthPayloadBody,
  AuthHeaders,
  AuthResponseHeaders,
  AuthResponseData,
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
  OdooApiResponse,
  Stage,
  FetchStagesResults,
  Ticket,
  CreateTicketPayload,
  FetchTicketResult,
  FetchTicketResults,
  UpdateTicketPayload,
  CreateTicketResult,
}
