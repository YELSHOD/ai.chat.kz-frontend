import { AUTH_ROUTES } from '../../auth/routes'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { LoginPage } from './pages/LoginPage'
import { OAuthCallbackPage } from './pages/OAuthCallbackPage'
import { RegisterPage } from './pages/RegisterPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { VerifyEmailPage } from './pages/VerifyEmailPage'

export function AuthRouter({
  route,
  queryToken,
  loading,
  error,
  notice,
  onLogin,
  onRegister,
  onVerifyEmail,
  onResendVerification,
  onForgotPassword,
  onResetPassword,
  onOpenRoute,
  onOAuth,
}) {
  if (route === AUTH_ROUTES.register) {
    return (
      <RegisterPage
        loading={loading}
        onRegister={onRegister}
        onOpenLogin={() => onOpenRoute(AUTH_ROUTES.login)}
        onResendVerification={onResendVerification}
        onOpenVerifyByToken={(token) => onOpenRoute(`${AUTH_ROUTES.verifyEmail}?token=${encodeURIComponent(token)}`)}
        error={error}
        notice={notice}
      />
    )
  }

  if (route === AUTH_ROUTES.verifyEmail) {
    return (
      <VerifyEmailPage
        loading={loading}
        queryToken={queryToken}
        onVerify={onVerifyEmail}
        onResendVerification={onResendVerification}
        error={error}
        notice={notice}
      />
    )
  }

  if (route === AUTH_ROUTES.forgotPassword) {
    return (
      <ForgotPasswordPage
        loading={loading}
        onSendResetLink={onForgotPassword}
        onOpenLogin={() => onOpenRoute(AUTH_ROUTES.login)}
        error={error}
        notice={notice}
      />
    )
  }

  if (route === AUTH_ROUTES.resetPassword) {
    return (
      <ResetPasswordPage
        loading={loading}
        queryToken={queryToken}
        onResetPassword={onResetPassword}
        onOpenLogin={() => onOpenRoute(AUTH_ROUTES.login)}
        error={error}
        notice={notice}
      />
    )
  }

  if (route === AUTH_ROUTES.oauthCallback) {
    return (
      <OAuthCallbackPage
        loading={loading}
        error={error}
        notice={notice}
        onOpenLogin={() => onOpenRoute(AUTH_ROUTES.login)}
      />
    )
  }

  return (
    <LoginPage
      loading={loading}
      onLogin={onLogin}
      onOpenRegister={() => onOpenRoute(AUTH_ROUTES.register)}
      onOpenForgotPassword={() => onOpenRoute(AUTH_ROUTES.forgotPassword)}
      onOAuth={onOAuth}
      error={error}
      notice={notice}
    />
  )
}
