import { FeedbackBanner } from '../../common/FeedbackBanner'

export function OAuthCallbackPage({ loading, error, notice, onOpenLogin }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="auth-brand">ai.chat.kz</p>
        <h1>OAuth callback</h1>
        <p className="muted">{loading ? 'Completing OAuth login...' : 'OAuth callback processed.'}</p>

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
