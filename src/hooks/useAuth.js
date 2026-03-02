import { useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../api/client'

export function useAuth() {
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken') || '')
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken') || '')
  const [me, setMe] = useState(null)

  function persistTokens(nextAccessToken, nextRefreshToken) {
    setAccessToken(nextAccessToken || '')
    setRefreshToken(nextRefreshToken || '')
    localStorage.setItem('accessToken', nextAccessToken || '')
    localStorage.setItem('refreshToken', nextRefreshToken || '')
  }

  function persistProfile(profile) {
    setMe(profile)
    localStorage.setItem('userEmail', profile?.email || '')
    localStorage.setItem('username', profile?.username || '')
  }

  function clearAuth() {
    persistTokens('', '')
    persistProfile(null)
  }

  async function fetchMe(token = accessToken) {
    const profile = await apiRequest('/api/auth/me', { method: 'GET', token })
    persistProfile(profile)
    return profile
  }

  async function login(email, password) {
    const payload = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })

    persistTokens(payload.accessToken, payload.refreshToken)
    persistProfile({ userId: payload.userId, email: payload.email, username: payload.username })
    return payload
  }

  async function register(email, password, username) {
    return apiRequest('/api/auth/register', {
      method: 'POST',
      body: { email, password, username },
    })
  }

  async function bootstrap() {
    if (!accessToken) return

    try {
      await fetchMe(accessToken)
    } catch {
      if (!refreshToken) {
        clearAuth()
        return
      }

      try {
        const payload = await apiRequest('/api/auth/refresh', {
          method: 'POST',
          body: { refreshToken },
        })

        persistTokens(payload.accessToken, payload.refreshToken)
        persistProfile({ userId: payload.userId, email: payload.email, username: payload.username })
      } catch {
        clearAuth()
      }
    }
  }

  useEffect(() => {
    bootstrap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    accessToken,
    refreshToken,
    me,
    isAuthed: useMemo(() => Boolean(me), [me]),
    login,
    register,
    logout: clearAuth,
  }
}
