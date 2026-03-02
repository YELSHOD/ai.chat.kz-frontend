export function FeedbackBanner({ error, notice }) {
  return (
    <>
      {error ? <p className="panel-error">{error}</p> : null}
      {notice ? <p className="panel-notice">{notice}</p> : null}
    </>
  )
}
