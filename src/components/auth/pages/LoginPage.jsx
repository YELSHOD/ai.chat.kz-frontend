import { FeedbackBanner } from '../../common/FeedbackBanner'

export function LoginPage({ loading, onLogin, onOpenRegister, onOpenForgotPassword, onOAuth, error, notice }) {
  function handleSubmit(event) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') || '').trim()
    const password = String(formData.get('password') || '')

    if (!email || !password) return
    onLogin({ email, password })
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="auth-brand">ai.chat.kz</p>
        <h1>Login</h1>

        <form className="auth-form" onSubmit={handleSubmit}>
          <input name="email" type="email" placeholder="Email" autoComplete="email" required />
          <input
            name="password"
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            required
          />
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Loading...' : 'Login'}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <div className="oauth-buttons">
          <button type="button" onClick={() => onOAuth('google')} disabled={loading}>
            Continue with Google
          </button>
          <button type="button" onClick={() => onOAuth('github')} disabled={loading}>
            Continue with GitHub
          </button>
        </div>

        <div className="auth-link-row">
          <button type="button" className="link-btn" onClick={onOpenForgotPassword}>
            Forgot password?
          </button>
          <button type="button" className="link-btn" onClick={onOpenRegister}>
            Create account
          </button>
        </div>

        <FeedbackBanner error={error} notice={notice} />
      </div>
    </div>
  )
}
