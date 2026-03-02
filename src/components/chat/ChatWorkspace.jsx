import { FeedbackBanner } from '../common/FeedbackBanner'
import { MessageList } from './MessageList'

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
  onDeleteChat,
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
          <button type="button" className="theme-btn" onClick={onToggleTheme}>
            {theme === 'dark' ? '☀︎' : '☾'}
          </button>
          <button
            type="button"
            className="profile-btn"
            onClick={onProfileClick}
            title={me?.username || me?.email || 'Profile'}
          >
            {(me?.username || me?.email || 'U').charAt(0).toUpperCase()}
          </button>
          <button type="button" className="danger-btn" onClick={onDeleteChat} disabled={disabledActions}>Удалить</button>
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
