import axios, { AxiosInstance } from 'axios'
import * as bp from '.botpress'
import { BulkEnrichmentPayload, ContactPayload, EnrichmentPayload, SearchPayload } from './definitions/schemas'

class ApolloApi {
  private _client: AxiosInstance

  public constructor(apiKey: string) {
    this._client = axios.create({
      baseURL: 'https://api.apollo.io/api/v1',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': apiKey,
      },
      timeout: 30000,
    })
  }

  public async createContact(contact: ContactPayload): Promise<object> {
    return this._client.request({
      method: 'POST',
      url: '/contacts',
      data: contact,
    })
  }

  public async updateContact(contact: { contact_id: string } & ContactPayload): Promise<object> {
    return this._client.request({
      method: 'PUT',
      url: `/contacts/${contact.contact_id}`,
      data: contact,
    })
  }

  public async searchContact(contact: SearchPayload): Promise<object> {
    const searchParams = new URLSearchParams()
    contact.q_keywords && searchParams.append('q_keywords', contact.q_keywords)
    contact.contact_stage_ids &&
      contact.contact_stage_ids.forEach((stageId) => searchParams.append('contact_stage_ids[]', stageId))
    contact.sort_by_field && searchParams.append('sort_by_field', contact.sort_by_field)
    contact.sort_ascending && searchParams.append('sort_ascending', contact.sort_ascending.toString())
    contact.page && searchParams.append('page', contact.page.toString())
    contact.per_page && searchParams.append('per_page', contact.per_page.toString())
    return this._client.request({
      method: 'GET',
      url: `/contacts/search?${searchParams.toString()}`,
    })
  }

  public async enrichPerson(payload: EnrichmentPayload): Promise<object> {
    const searchParams = new URLSearchParams()
    payload.first_name && searchParams.append('first_name', payload.first_name)
    payload.last_name && searchParams.append('last_name', payload.last_name)
    payload.email && searchParams.append('email', payload.email)
    payload.organization_name && searchParams.append('organization_name', payload.organization_name)
    payload.domain && searchParams.append('domain', payload.domain)
    payload.id && searchParams.append('id', payload.id)
    payload.linkedin_url && searchParams.append('linkedin_url', payload.linkedin_url)
    payload.reveal_personal_emails &&
      searchParams.append('reveal_personal_emails', payload.reveal_personal_emails.toString())
    payload.reveal_phone_numbers && searchParams.append('reveal_phone_numbers', payload.reveal_phone_numbers.toString())
    payload.webhook_url && searchParams.append('webhook_url', payload.webhook_url)
    return this._client.request({
      method: 'POST',
      url: `/people/match?${searchParams.toString()}`,
      data: payload,
    })
  }

  public async bulkEnrichPeople(payload: BulkEnrichmentPayload): Promise<object> {
    const searchParams = new URLSearchParams()
    payload.reveal_personal_emails &&
      searchParams.append('reveal_personal_emails', payload.reveal_personal_emails.toString())
    payload.reveal_phone_numbers && searchParams.append('reveal_phone_numbers', payload.reveal_phone_numbers.toString())
    payload.webhook_url && searchParams.append('webhook_url', payload.webhook_url)
    return this._client.request({
      method: 'POST',
      url: `/people/bulk_match?${searchParams.toString()}`,
      data: { details: payload.people },
    })
  }
}

export const getApolloClient = (config: bp.configuration.Configuration): ApolloApi => new ApolloApi(config.apiKey)
