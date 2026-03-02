function MessageCard({ message }) {
  return (
    <div className={`msg ${message.role.toLowerCase()}`}>
      <div className="msg-role">{message.role}</div>
      <div className="msg-content">{message.content}</div>
      <div className="msg-time">{new Date(message.createdAt).toLocaleString()}</div>
    </div>
  )
}

function ThinkingDots() {
  return (
    <div className="thinking-dots" aria-label="assistant is thinking">
      <span />
      <span />
      <span />
    </div>
  )
}

export function MessageList({ groupByDay, messagesByDay, messages, streaming, streamPreview }) {
  return (
    <div className="messages">
      {groupByDay
        ? messagesByDay.map((group) => (
            <section key={group.date} className="day-group">
              <h4>{group.date}</h4>
              {(group.messages || []).map((message) => (
                <MessageCard key={message.messageId} message={message} />
              ))}
            </section>
          ))
        : messages.map((message) => <MessageCard key={message.messageId} message={message} />)}

      {streaming ? (
        <div className="msg assistant">
          <div className="msg-role">ASSISTANT</div>
          <div className="msg-content">{streamPreview || <ThinkingDots />}</div>
        </div>
      ) : null}

      {!messages.length ? <p className="muted">No messages yet.</p> : null}
    </div>
  )
}
