export function parseOAuthCallbackHash(hashValue) {
  const raw = (hashValue || '').startsWith('#') ? hashValue.slice(1) : hashValue || ''
  const params = new URLSearchParams(raw)

  const parsed = {
    error: params.get('error') || '',
    accessToken: params.get('accessToken') || '',
    accessTokenExpiresAt: params.get('accessTokenExpiresAt') || '',
    refreshToken: params.get('refreshToken') || '',
    refreshTokenExpiresAt: params.get('refreshTokenExpiresAt') || '',
    userId: params.get('userId') || '',
    email: params.get('email') || '',
    username: params.get('username') || '',
  }

  return parsed
}
