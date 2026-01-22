import * as bp from '.botpress'

type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[]

type DebugResponse = {
  data?: JsonValue
  success?: boolean
  message?: string
  status?: number
}

export function debugResponse(title: string, response: DebugResponse, logger: bp.Logger) {
  const print = (title: string, message: string | object) => {
    if (typeof message === 'object') {
      message = JSON.stringify(message, null, 2)
    }
    logger.forBot().debug(`${title}: ${message}`)
  }

  print(`${title} Debug Info`, {
    data: response.data,
    success: response.success,
    message: response.message,
    status: response.status,
  })
}
