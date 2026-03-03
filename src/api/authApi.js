import { API_BASE_URL, apiRequest } from './client'

export function getOAuthAuthorizationUrl(provider) {
  return `${API_BASE_URL}/oauth2/authorization/${provider}`
}

export function loginRequest(email, password) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  })
}

export function registerRequest(email, password, username) {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: { email, password, username },
  })
}

export function refreshRequest(refreshToken) {
  return apiRequest('/api/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
  })
}

export function meRequest(token) {
  return apiRequest('/api/auth/me', {
    method: 'GET',
    token,
  })
}

export function verifyEmailRequest(token) {
  return apiRequest('/api/auth/verify-email', {
    method: 'POST',
    body: { token },
  })
}

export function resendVerificationRequest(email) {
  return apiRequest('/api/auth/resend-verification', {
    method: 'POST',
    body: { email },
  })
}

export function forgotPasswordRequest(email) {
  return apiRequest('/api/auth/forgot-password', {
    method: 'POST',
    body: { email },
  })
}

export function resetPasswordRequest(token, newPassword) {
  return apiRequest('/api/auth/reset-password', {
    method: 'POST',
    body: { token, newPassword },
  })
}
