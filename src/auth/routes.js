export const AUTH_ROUTES = {
  login: '/login',
  register: '/register',
  verifyEmail: '/verify-email',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  oauthCallback: '/auth/callback',
}

const AUTH_ROUTE_SET = new Set(Object.values(AUTH_ROUTES))

export function isAuthRoute(pathname) {
  return AUTH_ROUTE_SET.has(pathname)
}
