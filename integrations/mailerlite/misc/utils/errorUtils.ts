import * as bp from '.botpress'

export const extractError = (error: any, logger: bp.Logger) => {
  const fullErrorMsg = `${error?.errorCode || error?.message || 'Error'}`
  logger.forBot().error(fullErrorMsg)
  logger.forBot().error(JSON.stringify(error))

  return fullErrorMsg
}
