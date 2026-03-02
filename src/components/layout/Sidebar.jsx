export function Sidebar({
  me,
  loading,
  newProjectTitle,
  setNewProjectTitle,
  onCreateProject,
  selectedProjectId,
  setSelectedProjectId,
  projects,
  newChatTitle,
  setNewChatTitle,
  onCreateChat,
  chats,
  selectedChatId,
  setSelectedChatId,
  onLogout,
  onCloseMobile,
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="brand-row">
          <span className="brand-logo">✦</span>
          <span className="brand-text">ChatGPT</span>
        </div>
        <button type="button" className="ghost-btn" onClick={onCloseMobile}>×</button>
      </div>

      <div className="quick-actions">
        <button type="button" className="quick-item">✎ Новый чат</button>
        <button type="button" className="quick-item">⌕ Поиск в чатах</button>
      </div>

      <section className="sidebar-section">
        <div className="section-title">Проекты</div>
        <form className="mini-form" onSubmit={onCreateProject}>
          <input
            value={newProjectTitle}
            onChange={(e) => setNewProjectTitle(e.target.value)}
            placeholder="Новый проект"
            maxLength={120}
          />
          <button type="submit" disabled={loading}>+</button>
        </form>

        <div className="stack-list">
          <button
            className={selectedProjectId === 'personal' ? 'stack-item active' : 'stack-item'}
            type="button"
            onClick={() => setSelectedProjectId('personal')}
          >
            ▣ Personal
          </button>
          {projects.map((project) => (
            <button
              key={project.projectId}
              className={selectedProjectId === project.projectId ? 'stack-item active' : 'stack-item'}
              type="button"
              onClick={() => setSelectedProjectId(project.projectId)}
            >
              ▣ {project.title}
            </button>
          ))}
        </div>
      </section>

      <section className="sidebar-section">
        <div className="section-title">Ваши чаты</div>
        <form className="mini-form" onSubmit={onCreateChat}>
          <input
            value={newChatTitle}
            onChange={(e) => setNewChatTitle(e.target.value)}
            placeholder="Новый чат"
            maxLength={120}
          />
          <button type="submit" disabled={loading}>+</button>
        </form>

        <div className="stack-list">
          {chats.map((chat) => (
            <button
              key={chat.chatId}
              className={selectedChatId === chat.chatId ? 'stack-item active' : 'stack-item'}
              type="button"
              onClick={() => {
                setSelectedChatId(chat.chatId)
                onCloseMobile()
              }}
            >
              ◦ {chat.title}
            </button>
          ))}
        </div>
      </section>

      <div className="sidebar-footer">
        <div className="profile-name">{me?.username || me?.email}</div>
        <button type="button" onClick={onLogout}>Выйти</button>
      </div>
    </aside>
  )
}
