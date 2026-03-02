export function ChatsPanel({
  loading,
  newChatTitle,
  setNewChatTitle,
  onCreateChat,
  onRefreshChats,
  chats,
  selectedChatId,
  setSelectedChatId,
}) {
  return (
    <aside className="mid-panel">
      <div className="panel-head">
        <h2>Chats</h2>
        <button type="button" onClick={onRefreshChats}>Refresh</button>
      </div>

      <form className="inline-form" onSubmit={onCreateChat}>
        <input
          value={newChatTitle}
          onChange={(e) => setNewChatTitle(e.target.value)}
          placeholder="New chat"
          maxLength={120}
        />
        <button type="submit" disabled={loading}>+
        </button>
      </form>

      <div className="list-wrap">
        {chats.map((chat) => (
          <button
            key={chat.chatId}
            className={selectedChatId === chat.chatId ? 'item active' : 'item'}
            type="button"
            onClick={() => setSelectedChatId(chat.chatId)}
          >
            {chat.title}
          </button>
        ))}
      </div>
    </aside>
  )
}
