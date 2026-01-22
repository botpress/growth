import * as bp from '.botpress'

export function debugResponse(title:string, response: any, logger: bp.Logger) {
  const print = (title: string, message: string | object) => {
    if (typeof message === 'object') {
      message = JSON.stringify(message, null, 2)
    }
    logger.forBot().debug(`${title}: ${message}`)
  }
  print(
    `${title} Debug Info`,
    {
      data: response.data,
      success: response.success,
      message: response.message,
      status: response.status,
    }
  )
}