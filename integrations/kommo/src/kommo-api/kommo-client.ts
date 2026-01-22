import axios, { AxiosInstance } from 'axios'
import * as sdk from '@botpress/sdk'
import * as bp from '../../.botpress'
import { CreateLeadRequest, KommoLead, KommoCreateResponse, KommoGetResponse, UpdateLeadRequest } from './types'

// handles api communcation with kommo
export class KommoClient {
  private _axios: AxiosInstance
  private _logger: bp.Logger

  constructor(accessToken: string, baseDomain: string, logger: bp.Logger) {
    this._logger = logger

    // Ensure basedomain doesn't have protocol prefix
    const cleanDomain = baseDomain.replace(/^https?:\/\//, '')

    // Create axios instance with Kommo API configuration
    this._axios = axios.create({
      baseURL: `https://${cleanDomain}/api/v4`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    this._logger.forBot().debug('KommoClient initialized', {
      baseURL: `https://${cleanDomain}/api/v4`
    })
  }

// creates new lead in kommo
  async createLead(data: CreateLeadRequest): Promise<KommoLead> {
    try {
      this._logger.forBot().debug('Creating lead in Kommo', { name: data.name })

      // Kommo requires leads to be sent as an array
      const response = await this._axios.post<KommoCreateResponse>('/leads', [data])

      // Get the created lead ID from the response
      const createdLeadId = response.data._embedded.leads[0]?.id

      if (!createdLeadId) {
        throw new sdk.RuntimeError('No lead ID returned from Kommo')
      }

      // Fetch the full lead details
      const lead = await this.getLead(createdLeadId)

      if (!lead) {
        throw new sdk.RuntimeError('Failed to fetch created lead')
      }

      this._logger.forBot().info('Lead created successfully', { leadId: lead.id })
      return lead
    } catch (error: any) {
      this._logger.forBot().error('Failed to create lead', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      })
      throw new sdk.RuntimeError(`Failed to create lead in Kommo: ${error.message}`)
    }
  }


  // gets a lead by id
  async getLead(leadId: number): Promise<KommoLead | undefined> {
    try {
      this._logger.forBot().debug('Fetching lead from Kommo', { leadId })

      const response = await this._axios.get<KommoGetResponse>(`/leads/${leadId}`)
      const lead = response.data

      return lead
    } catch (error: any) {
      if (error.response?.status === 404) {
        this._logger.forBot().info('Lead not found', { leadId })
        return undefined
      }

      this._logger.forBot().error('Failed to fetch lead', {
        leadId,
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      })
      throw new sdk.RuntimeError(`Failed to fetch lead from Kommo: ${error.message}`)
    }
  }

  // update a single lead
  async updateLead(leadId: number, data: UpdateLeadRequest): Promise<KommoLead>{
    try{
      this._logger.forBot().debug('Updating lead in Kommo', { leadId, data })

      // Update the lead in Kommo
      await this._axios.patch(`/leads/${leadId}`, data)

      // Fetch the full lead details after update
      const lead = await this.getLead(leadId)

      if (!lead) {
        throw new sdk.RuntimeError('Failed to fetch updated lead')
      }

      this._logger.forBot().info('Lead updated successfully', { leadId: lead.id })
      return lead
    }catch (error: any){
      this._logger.forBot().error('Failed to update lead', {
        leadId,
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      })
      throw new sdk.RuntimeError(`Failed to update lead in Kommo: ${error.message}`)
    }
  }
}
