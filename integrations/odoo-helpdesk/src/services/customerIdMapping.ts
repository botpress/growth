import * as bp from '.botpress'
import { RuntimeError } from '@botpress/client'
import { z } from '@botpress/sdk'
import { safeGetOrSetState, safeSetState } from 'src/utils'

/**
 * Service responsible for managing the mapping between Botpress customer IDs and Odoo customer IDs.
 */
export class CustomerIdMappingService {
  private readonly client: bp.Client
  private readonly integrationId: string

  constructor(client: bp.Client, integrationId: string) {
    this.client = client
    this.integrationId = integrationId
  }

  /**
   * Retrieves the Odoo ID for a given Botpress customer ID.
   *
   * @param bpId - The Botpress customer ID
   * @returns The corresponding Odoo customer ID
   * @throws RuntimeError if the mapping doesn't exist
   */
  async getOdooId(bpId: string): Promise<number> {
    const mapping = await this.getMapping()
    const odooId = mapping[bpId]

    if (!odooId) {
      throw new RuntimeError(`No Odoo ID found for customer ID: ${bpId}`)
    }

    return odooId
  }

  /**
   * Stores a mapping between Botpress customer ID and Odoo customer ID.
   *
   * @param bpId - The Botpress customer ID
   * @param odooId - The Odoo customer ID
   */
  async setMapping(bpId: string, odooId: number): Promise<void> {
    const mapping = await this.getMapping()
    mapping[bpId] = odooId

    await safeSetState(this.client, {
      type: 'integration',
      name: 'customerIdMapping',
      id: this.integrationId,
      payload: { customerIdMapping: mapping },
    })
  }

  /**
   * Retrieves the current ID mapping from state.
   *
   * @returns The mapping object with Botpress IDs as keys and Odoo IDs as values
   */
  private async getMapping(): Promise<Record<string, number>> {
    const { state } = await safeGetOrSetState(this.client, {
      type: 'integration',
      name: 'customerIdMapping',
      id: this.integrationId,
      payload: { customerIdMapping: {} },
    })

    if (
      state.payload === undefined ||
      state.payload === null ||
      typeof state.payload !== 'object' ||
      Array.isArray(state.payload)
    ) {
      throw new RuntimeError('Invalid state payload: customerIdMapping not found')
    }

    if ('customerIdMapping' in state.payload) {
      const mapping: Record<string, number> = z.record(z.string(), z.number()).parse(state.payload.customerIdMapping)
      return mapping
    }

    throw new RuntimeError('Invalid state payload: customerIdMapping not found')
  }
}
