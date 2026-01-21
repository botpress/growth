import * as bp from '.botpress'
import { RuntimeError } from '@botpress/client'
import { safeGetOrSetState, safeSetState } from 'src/utils'

/**
 * Service responsible for managing the mapping between Botpress customer IDs and Odoo customer IDs.
 * Follows Single Responsibility Principle - only handles ID mapping operations.
 */
export class CustomerIdMappingService {
  private readonly client: bp.Client
  private readonly integrationId: string
  private readonly logger: bp.Logger

  constructor(client: bp.Client, integrationId: string, logger: bp.Logger) {
    this.client = client
    this.integrationId = integrationId
    this.logger = logger
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

    // Validate payload structure.
    if (!state.payload || typeof state.payload !== 'object' || Array.isArray(state.payload)) {
      return {}
    }

    // Type guard to safely access customerIdMapping.
    if ('customerIdMapping' in state.payload) {
      const mapping = state.payload.customerIdMapping
      if (
        mapping &&
        typeof mapping === 'object' &&
        !Array.isArray(mapping) &&
        Object.values(mapping).every((v) => typeof v === 'number')
      ) {
        return mapping as Record<string, number>
      }
    }

    return {}
  }
}
