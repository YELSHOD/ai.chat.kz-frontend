import { useState } from 'react'
import { FeedbackBanner } from '../../common/FeedbackBanner'

export function ResetPasswordPage({ loading, queryToken, onResetPassword, onOpenLogin, error, notice }) {
  const [token, setToken] = useState(queryToken || '')
  const [passwordMismatch, setPasswordMismatch] = useState('')

  function handleSubmit(event) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const newPassword = String(formData.get('newPassword') || '')
    const confirmPassword = String(formData.get('confirmPassword') || '')

    if (!token.trim() || !newPassword || !confirmPassword) return
    if (newPassword !== confirmPassword) {
      setPasswordMismatch('Passwords do not match')
      return
    }

    setPasswordMismatch('')
    onResetPassword(token.trim(), newPassword)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="auth-brand">ai.chat.kz</p>
        <h1>Reset password</h1>

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Reset token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />
          <input name="newPassword" type="password" placeholder="New password" minLength={6} required />
          <input name="confirmPassword" type="password" placeholder="Confirm password" minLength={6} required />
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset password'}
          </button>
        </form>

        {passwordMismatch ? <p className="panel-error">{passwordMismatch}</p> : null}

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
