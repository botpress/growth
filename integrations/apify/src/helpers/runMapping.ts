import * as bp from '.botpress';

export async function persistRunMapping(
  client: bp.Client, 
  integrationId: string,
  runId: string, 
  kbId: string
) {
  const existingMapping = await client.getState({
    type: 'integration',
    id: integrationId,
    name: 'apifyRunMappings',
  });

  const payload = existingMapping.state.payload;
  const currentMap = {...payload};

  currentMap[runId] = kbId;

  await client.setState({
    type: 'integration',
    id: integrationId,
    name: 'apifyRunMappings',
    payload: currentMap,
  });
}
