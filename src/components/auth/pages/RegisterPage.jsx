import { useState } from 'react'
import { FeedbackBanner } from '../../common/FeedbackBanner'

export function RegisterPage({
  loading,
  onRegister,
  onOpenLogin,
  onResendVerification,
  onOpenVerifyByToken,
  error,
  notice,
}) {
  const [sentEmail, setSentEmail] = useState('')
  const [manualToken, setManualToken] = useState('')

  async function handleRegister(event) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const username = String(formData.get('username') || '').trim()
    const email = String(formData.get('email') || '').trim()
    const password = String(formData.get('password') || '')

    if (!username || !email || !password) return

    await onRegister({ username, email, password })
    setSentEmail(email)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="auth-brand">ai.chat.kz</p>
        <h1>Create account</h1>

        {!sentEmail ? (
          <form className="auth-form" onSubmit={handleRegister}>
            <input name="username" type="text" placeholder="Username" maxLength={32} required />
            <input name="email" type="email" placeholder="Email" autoComplete="email" required />
            <input name="password" type="password" placeholder="Password" minLength={6} required />
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Loading...' : 'Create account'}
            </button>
          </form>
        ) : (
          <div className="auth-result-block">
            <p>Email sent to <strong>{sentEmail}</strong></p>
            <button type="button" onClick={() => onResendVerification(sentEmail)} disabled={loading}>
              Resend verification email
            </button>

            <div className="auth-inline">
              <input
                type="text"
                placeholder="I already have token"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
              />
              <button type="button" onClick={() => onOpenVerifyByToken(manualToken)} disabled={!manualToken.trim()}>
                Verify
              </button>
            </div>
          </div>
        )}

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
