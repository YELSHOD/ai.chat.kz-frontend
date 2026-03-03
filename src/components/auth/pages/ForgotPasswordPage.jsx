import { FeedbackBanner } from '../../common/FeedbackBanner'

export function ForgotPasswordPage({ loading, onSendResetLink, onOpenLogin, error, notice }) {
  function handleSubmit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') || '').trim()
    if (!email) return
    onSendResetLink(email)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="auth-brand">ai.chat.kz</p>
        <h1>Forgot password</h1>

        <form className="auth-form" onSubmit={handleSubmit}>
          <input name="email" type="email" placeholder="Email" autoComplete="email" required />
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <div className="auth-link-row single">
          <button type="button" className="link-btn" onClick={onOpenLogin}>
            Back to login
          </button>
        </div>

        <FeedbackBanner error={error} notice={notice} />
      </div>
    </div>
  )
}
