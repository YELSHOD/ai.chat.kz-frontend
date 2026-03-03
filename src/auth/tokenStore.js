const SESSION_KEY = 'auth.session'
const PROFILE_KEY = 'auth.profile'

function parseJson(value, fallback) {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function normalizeEpoch(value) {
  if (!value) return 0

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  const numeric = Number(value)
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric
  }

  const dateTs = new Date(value).getTime()
  return Number.isFinite(dateTs) ? dateTs : 0
}

export function tokenExpiryFromJwt(token) {
  if (!token || typeof token !== 'string') return 0

  const parts = token.split('.')
  if (parts.length < 2) return 0

  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload?.exp ? payload.exp * 1000 : 0
  } catch {
    return 0
  }
}

export function readAuthSession() {
  const stored = parseJson(localStorage.getItem(SESSION_KEY), null)
  if (stored) {
    return {
      accessToken: stored.accessToken || '',
      refreshToken: stored.refreshToken || '',
      accessTokenExpiresAt: normalizeEpoch(stored.accessTokenExpiresAt),
      refreshTokenExpiresAt: normalizeEpoch(stored.refreshTokenExpiresAt),
      userId: stored.userId || '',
      email: stored.email || '',
      username: stored.username || '',
    }
  }

  return {
    accessToken: localStorage.getItem('accessToken') || '',
    refreshToken: localStorage.getItem('refreshToken') || '',
    accessTokenExpiresAt: 0,
    refreshTokenExpiresAt: 0,
    userId: '',
    email: localStorage.getItem('userEmail') || '',
    username: localStorage.getItem('username') || '',
  }
}

export function writeAuthSession(session) {
  const normalized = {
    accessToken: session?.accessToken || '',
    refreshToken: session?.refreshToken || '',
    accessTokenExpiresAt: normalizeEpoch(session?.accessTokenExpiresAt),
    refreshTokenExpiresAt: normalizeEpoch(session?.refreshTokenExpiresAt),
    userId: session?.userId || '',
    email: session?.email || '',
    username: session?.username || '',
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(normalized))

  localStorage.setItem('accessToken', normalized.accessToken)
  localStorage.setItem('refreshToken', normalized.refreshToken)
  localStorage.setItem('userEmail', normalized.email)
  localStorage.setItem('username', normalized.username)

  return normalized
}

export function clearAuthSession() {
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('userEmail')
  localStorage.removeItem('username')
}

export function readProfile() {
  return parseJson(localStorage.getItem(PROFILE_KEY), null)
}

export function writeProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile || null))
}

export function clearProfile() {
  localStorage.removeItem(PROFILE_KEY)
}

export function isExpired(expiresAt, skewMs = 0) {
  if (!expiresAt) return false
  return Date.now() + skewMs >= expiresAt
}

export function toEpoch(value) {
  return normalizeEpoch(value)
}
