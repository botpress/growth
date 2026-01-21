import * as bp from '.botpress'
import { RuntimeError } from '@botpress/client'

/**
 * Safely executes getOrSetState with error handling.
 * Follows Single Responsibility Principle - only handles state retrieval with error handling.
 *
 * @param client - The Botpress client instance
 * @param params - The state parameters
 * @param logger - The logger instance
 * @returns The state result
 * @throws RuntimeError if state operation fails
 */
export async function safeGetOrSetState(
  client: bp.Client,
  params: Parameters<bp.Client['getOrSetState']>[0],
): Promise<Awaited<ReturnType<bp.Client['getOrSetState']>>> {
  try {
    return await client.getOrSetState(params)
  } catch (error) {
    throw new RuntimeError(
      `Failed to get or set state for ${params.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Safely executes getState with error handling.
 * Follows Single Responsibility Principle - only handles state retrieval with error handling.
 *
 * @param client - The Botpress client instance
 * @param params - The state parameters
 * @param logger - The logger instance
 * @returns The state result
 * @throws RuntimeError if state operation fails
 */
export async function safeGetState(
  client: bp.Client,
  params: Parameters<bp.Client['getState']>[0],
): Promise<Awaited<ReturnType<bp.Client['getState']>>> {
  try {
    return await client.getState(params)
  } catch (error) {
    throw new RuntimeError(
      `Failed to get state for ${params.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Safely executes setState with error handling.
 * Follows Single Responsibility Principle - only handles state updates with error handling.
 *
 * @param client - The Botpress client instance
 * @param params - The state parameters
 * @param logger - The logger instance
 * @throws RuntimeError if state operation fails
 */
export async function safeSetState(
  client: bp.Client,
  params: Parameters<bp.Client['setState']>[0],
): Promise<void> {
  try {
    await client.setState(params)
  } catch (error) {
    throw new RuntimeError(
      `Failed to set state for ${params.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
