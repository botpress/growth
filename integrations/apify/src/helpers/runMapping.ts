import * as bp from '.botpress';

export async function persistRunMapping(
  client: bp.Client, 
  integrationId: string,
  runId: string, 
  kbId: string
) {
  let currentMap: Record<string, string> = {}
  try {
    const existingMapping = await client.getState({
      type: 'integration',
      id: integrationId,
      name: 'apifyRunMappings',
    });
    const payload = existingMapping.state.payload
    currentMap = { ...payload }
  } catch {
    currentMap = {}
  }

  currentMap[runId] = kbId;

  await client.setState({
    type: 'integration',
    id: integrationId,
    name: 'apifyRunMappings',
    payload: currentMap,
  });
}
