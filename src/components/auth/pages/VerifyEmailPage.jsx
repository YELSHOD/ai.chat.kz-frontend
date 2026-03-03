import { useEffect, useRef, useState } from 'react'
import { FeedbackBanner } from '../../common/FeedbackBanner'

export function VerifyEmailPage({ loading, queryToken, onVerify, onResendVerification, error, notice }) {
  const [token, setToken] = useState(queryToken || '')
  const autoTriedRef = useRef(false)

  useEffect(() => {
    if (!queryToken || autoTriedRef.current) return
    autoTriedRef.current = true
    onVerify(queryToken)
  }, [onVerify, queryToken])

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="auth-brand">ai.chat.kz</p>
        <h1>Verify email</h1>

        <form
          className="auth-form"
          onSubmit={(event) => {
            event.preventDefault()
            onVerify(token)
          }}
        >
          <input
            type="text"
            placeholder="Verification token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>

        <button type="button" className="link-btn" onClick={() => onResendVerification()}>
          Resend verification email
        </button>

        <FeedbackBanner error={error} notice={notice} />
      </div>
    </div>
  )
}
