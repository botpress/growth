import * as client from '@botpress/client'
import * as bp from '.botpress'

export * from '@botpress/client'
export const clientFrom = (client: bp.Client): client.Client => {
  /*
  im getting an undefined error here because of the client

  im trying to figure out which one works with plugins :(
  */
  console.log("Client keys:", Object.keys(client));
  
  if ((client as any)._client) {
    console.log("Found _client property");
    return (client as any)._client;
  } else if ((client as any).vanilla) {
    console.log("Found vanilla property");
    return (client as any).vanilla;
  } else {
    console.log("Client structure:", JSON.stringify(client, null, 2));
    throw new Error("Could not find vanilla client property");
  }
}
