import { useEffect, useMemo, useRef, useState } from 'react'
import { apiRequest, ApiError, streamGenerate } from '../api/client'
import {
  forgotPasswordRequest,
  getOAuthAuthorizationUrl,
  loginRequest,
  meRequest,
  refreshRequest,
  registerRequest,
  resendVerificationRequest,
  resetPasswordRequest,
  verifyEmailRequest,
} from '../api/authApi'
import {
  clearAuthSession,
  clearProfile,
  isExpired,
  readAuthSession,
  readProfile,
  toEpoch,
  tokenExpiryFromJwt,
  writeAuthSession,
  writeProfile,
} from '../auth/tokenStore'

function createEmptySession() {
  return {
    accessToken: '',
    refreshToken: '',
    accessTokenExpiresAt: 0,
    refreshTokenExpiresAt: 0,
    userId: '',
    email: '',
    username: '',
  }
}

function normalizeAuthPayload(payload, fallback = {}) {
  const accessToken = payload?.accessToken || fallback.accessToken || ''
  const refreshToken = payload?.refreshToken || fallback.refreshToken || ''

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt:
      toEpoch(payload?.accessTokenExpiresAt) || tokenExpiryFromJwt(accessToken) || fallback.accessTokenExpiresAt || 0,
    refreshTokenExpiresAt:
      toEpoch(payload?.refreshTokenExpiresAt) || tokenExpiryFromJwt(refreshToken) || fallback.refreshTokenExpiresAt || 0,
    userId: payload?.userId || fallback.userId || '',
    email: payload?.email || fallback.email || '',
    username: payload?.username || fallback.username || '',
  }
}

export function useAuth() {
  const [session, setSession] = useState(() => readAuthSession())
  const [me, setMe] = useState(() => readProfile())

  const sessionRef = useRef(session)
  const refreshInFlightRef = useRef(null)

  useEffect(() => {
    sessionRef.current = session
  }, [session])

  function persistSession(nextSession) {
    const normalized = writeAuthSession(nextSession)
    setSession(normalized)
    sessionRef.current = normalized
    return normalized
  }

  function persistProfile(profile) {
    setMe(profile)
    writeProfile(profile)
  }

  function clearAuth() {
    const emptySession = createEmptySession()
    setSession(emptySession)
    setMe(null)
    sessionRef.current = emptySession
    refreshInFlightRef.current = null
    clearAuthSession()
    clearProfile()
  }

  function saveFromAuthPayload(payload, fallbackSession = sessionRef.current) {
    const merged = normalizeAuthPayload(payload, fallbackSession)
    persistSession(merged)

    const hasProfileData = merged.userId || merged.email || merged.username
    if (hasProfileData) {
      persistProfile({
        userId: merged.userId,
        email: merged.email,
        username: merged.username,
        emailVerified: payload?.emailVerified,
      })
    }

    return merged
  }

  async function refreshAccessToken(force = false) {
    const current = sessionRef.current
    if (!current.refreshToken) {
      throw new ApiError('Session expired')
    }

    if (isExpired(current.refreshTokenExpiresAt, 0)) {
      clearAuth()
      throw new ApiError('Session expired')
    }

    if (!force && !isExpired(current.accessTokenExpiresAt, 30_000)) {
      return current.accessToken
    }

    if (!refreshInFlightRef.current) {
      refreshInFlightRef.current = refreshRequest(current.refreshToken)
        .then((payload) => {
          const next = saveFromAuthPayload(payload, current)
          return next.accessToken
        })
        .catch((error) => {
          clearAuth()
          throw error
        })
        .finally(() => {
          refreshInFlightRef.current = null
        })
    }

    return refreshInFlightRef.current
  }

  async function ensureAccessToken() {
    const current = sessionRef.current
    if (!current.accessToken) {
      if (!current.refreshToken) throw new ApiError('Unauthorized')
      return refreshAccessToken(true)
    }

    if (isExpired(current.accessTokenExpiresAt, 30_000)) {
      return refreshAccessToken(true)
    }

    return current.accessToken
  }

  async function authorizedRequest(path, options = {}) {
    const token = await ensureAccessToken()

    try {
      return await apiRequest(path, { ...options, token })
    } catch (error) {
      if (error?.status === 401 && sessionRef.current.refreshToken) {
        const freshToken = await refreshAccessToken(true)
        return apiRequest(path, { ...options, token: freshToken })
      }
      throw error
    }
  }

  async function authorizedStreamGenerate(params) {
    const token = await ensureAccessToken()

    try {
      return await streamGenerate({ ...params, token })
    } catch (error) {
      if (error?.status === 401 && sessionRef.current.refreshToken) {
        const freshToken = await refreshAccessToken(true)
        return streamGenerate({ ...params, token: freshToken })
      }
      throw error
    }
  }

  async function fetchMe() {
    const token = await ensureAccessToken()
    const profile = await meRequest(token)

    persistProfile(profile)
    const current = sessionRef.current

    if (profile?.email || profile?.username || profile?.userId) {
      persistSession({
        ...current,
        userId: profile.userId || current.userId,
        email: profile.email || current.email,
        username: profile.username || current.username,
      })
    }

    return profile
  }

  async function login(email, password) {
    const payload = await loginRequest(email, password)
    saveFromAuthPayload(payload)
    await fetchMe().catch(() => {})
    return payload
  }

  async function register(email, password, username) {
    return registerRequest(email, password, username)
  }

  async function verifyEmail(token) {
    const payload = await verifyEmailRequest(token)
    saveFromAuthPayload(payload)
    await fetchMe().catch(() => {})
    return payload
  }

  async function completeOAuth(payload) {
    if (payload?.error) {
      throw new ApiError(payload.error)
    }

    if (!payload?.accessToken) {
      throw new ApiError('OAuth callback does not contain tokens')
    }

    saveFromAuthPayload(payload)
    await fetchMe().catch(() => {})
  }

  async function bootstrap() {
    const current = sessionRef.current
    if (!current.accessToken && !current.refreshToken) return

    try {
      await fetchMe()
    } catch {
      clearAuth()
    }
  }

  useEffect(() => {
    bootstrap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      const current = sessionRef.current
      if (!current.refreshToken) return
      if (isExpired(current.accessTokenExpiresAt, 30_000)) {
        refreshAccessToken(true).catch(() => {})
      }
    }, 20_000)

    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    me,
    isAuthed: useMemo(() => Boolean(session.accessToken && me), [session.accessToken, me]),
    buildOAuthUrl: getOAuthAuthorizationUrl,
    login,
    register,
    verifyEmail,
    resendVerification: resendVerificationRequest,
    forgotPassword: forgotPasswordRequest,
    resetPassword: resetPasswordRequest,
    completeOAuth,
    logout: clearAuth,
    authorizedRequest,
    authorizedStreamGenerate,
  }
}
