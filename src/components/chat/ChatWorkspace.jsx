import { FeedbackBanner } from '../common/FeedbackBanner'
import { MessageList } from './MessageList'

function ThemeLightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9L5.3 5.3"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function ThemeDarkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M19.5 15.1a8.5 8.5 0 1 1-10.6-10.6 7 7 0 1 0 10.6 10.6z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

export function ChatWorkspace({
  selectedChatId,
  selectedChatTitle,
  me,
  theme,
  onToggleTheme,
  onProfileClick,
  loading,
  streaming,
  groupByDay,
  setGroupByDay,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  onLoadByDay,
  messages,
  messagesByDay,
  streamPreview,
  onStopStream,
  newMessageContent,
  setNewMessageContent,
  onSendUserMessage,
  error,
  notice,
  onOpenSidebar,
}) {
  const disabledActions = !selectedChatId || loading || streaming

  return (
    <main className="chat-shell">
      <header className="chat-header">
        <button type="button" className="menu-btn" onClick={onOpenSidebar}>☰</button>
        <div className="chat-title">{selectedChatId ? (selectedChatTitle || 'Чат') : 'ChatGPT 5.2'}</div>
        <div className="header-actions">
          <button type="button" className="theme-btn" onClick={onToggleTheme} title="Переключить тему">
            {theme === 'dark' ? <ThemeLightIcon /> : <ThemeDarkIcon />}
          </button>
          <button
            type="button"
            className="profile-btn"
            onClick={onProfileClick}
            title={me?.username || me?.email || 'Profile'}
          >
            {(me?.username || me?.email || 'U').charAt(0).toUpperCase()}
          </button>
        </div>
      </header>

      {!selectedChatId ? (
        <section className="empty-state">
          <h1>Привет. Готов погрузиться?</h1>
          <p>Выбери чат слева или создай новый.</p>
        </section>
      ) : (
        <section className="messages-wrap">
          <div className="filters-row">
            <label>
              <input type="checkbox" checked={groupByDay} onChange={(e) => setGroupByDay(e.target.checked)} />
              По дням
            </label>
            {groupByDay ? (
              <>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                <button type="button" onClick={onLoadByDay} disabled={disabledActions}>Load</button>
              </>
            ) : null}
          </div>

          <MessageList
            groupByDay={groupByDay}
            messagesByDay={messagesByDay}
            messages={messages}
            streaming={streaming}
            streamPreview={streamPreview}
          />
        </section>
      )}

      <footer className="composer-dock">
        <textarea
          value={newMessageContent}
          onChange={(e) => setNewMessageContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onSendUserMessage()
            }
          }}
          placeholder="Спросите ChatGPT"
          maxLength={15000}
          disabled={!selectedChatId || streaming}
        />
        <div className="composer-actions">
          <button
            type="button"
            className="send-main-btn"
            onClick={onSendUserMessage}
            disabled={!selectedChatId || !newMessageContent.trim() || loading || streaming}
          >
            {streaming ? 'Streaming...' : 'Send'}
          </button>
          {streaming ? (
            <button type="button" className="stop-btn" onClick={onStopStream}>Stop</button>
          ) : null}
        </div>
      </footer>

      <div className="chat-feedback">
        <FeedbackBanner error={error} notice={notice} />
      </div>
    </main>
  )
}
