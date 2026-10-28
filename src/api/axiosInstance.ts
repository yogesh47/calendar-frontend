import axios from 'axios'
import { ApiError, OFFLINE_MESSAGE } from '@/lib/apiError'
import { API_BASE_URL } from '@/modules/Auth/constants'
import { readSession, signOutOnExpiry } from '@/modules/Auth/services'

/*
  The one HTTP client the app uses. Every request carries the signed-in user's
  token, every failure comes back as the app's ApiError, and a request the
  server refuses for an expired session signs the user out — except the auth
  calls themselves, where a 401 means a wrong password, not an old session.
*/
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

axiosInstance.interceptors.request.use((config) => {
  const session = readSession()
  if (session && !config.headers.Authorization) config.headers.Authorization = `Bearer ${session.token}`

  return config
})

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!axios.isAxiosError(error) || !error.response) {
      return Promise.reject(new ApiError(0, { detail: OFFLINE_MESSAGE, code: 'offline' }))
    }

    const failure = new ApiError(error.response.status, error.response.data ?? {})
    const isAuthCall = (error.config?.url ?? '').startsWith('/auth/')
    if (failure.isAuth && !isAuthCall) signOutOnExpiry()

    return Promise.reject(failure)
  },
)

export default axiosInstance
