import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async () => {
  console.log('Registering Apollo.io integration')
}

export const unregister: bp.IntegrationProps['unregister'] = async () => {
  console.log('Unregistering Apollo.io integration')
}
