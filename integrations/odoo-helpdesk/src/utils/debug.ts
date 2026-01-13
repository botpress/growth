import axios from 'axios'

const debugUrl = process.env.DEBUG_URL
export const print = async (message: string) => {
  if (!debugUrl) {throw new Error('DEBUG_URL is not set')}
  return axios.post(debugUrl, { message })
}