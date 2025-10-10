import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import * as bp from '.botpress'
import { getAccessToken } from './auth'

export const getAxiosClient = async ({
  ctx,
  client,
}: {
  ctx: bp.Context
  client: bp.Client
}): Promise<AxiosInstance> => {
  const token = await getAccessToken({ ctx, client })
  const baseURL = 'https://api.persat.com.ar/v1/'

  const instance = axios.create({
    baseURL: baseURL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    config.headers = config.headers ?? {}
    return config
  })

  return instance
}
