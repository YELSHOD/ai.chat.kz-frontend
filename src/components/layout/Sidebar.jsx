import { useEffect, useMemo, useRef, useState } from 'react'

export function Sidebar({
  me,
  loading,
  newProjectTitle,
  setNewProjectTitle,
  onCreateProject,
  selectedProjectId,
  setSelectedProjectId,
  projects,
  onRenameProject,
  onDeleteProject,
  newChatTitle,
  setNewChatTitle,
  onCreateChat,
  onQuickCreateChat,
  chats,
  onRenameChat,
  onDeleteChat,
  chatSearchQuery,
  setChatSearchQuery,
  selectedChatId,
  setSelectedChatId,
  onLogout,
  onCloseMobile,
}) {
  const searchInputRef = useRef(null)
  const [openMenu, setOpenMenu] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [deletingItem, setDeletingItem] = useState(null)
  const normalizedSearchQuery = chatSearchQuery.trim().toLowerCase()

  const visibleChats = useMemo(() => {
    if (!normalizedSearchQuery) return chats
    return chats.filter((chat) => (chat.title || '').toLowerCase().includes(normalizedSearchQuery))
  }, [chats, normalizedSearchQuery])

  useEffect(() => {
    function handleClickOutside(event) {
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.closest('.stack-menu') || target.closest('.stack-menu-btn')) return
      setOpenMenu(null)
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  function menuKey(type, id) {
    return `${type}:${id}`
  }

  function startRename(type, item) {
    const id = type === 'chat' ? item.chatId : item.projectId
    const title = item.title || ''
    setEditingItem({ type, id, draft: title })
    setDeletingItem(null)
    setOpenMenu(null)
  }

  function startDelete(type, item) {
    const id = type === 'chat' ? item.chatId : item.projectId
    setDeletingItem({ type, id })
    setEditingItem(null)
    setOpenMenu(null)
  }

  async function saveRename() {
    if (!editingItem) return
    const title = editingItem.draft.trim()
    if (!title) return

    if (editingItem.type === 'chat') {
      await onRenameChat(editingItem.id, title)
    } else {
      await onRenameProject(editingItem.id, title)
    }
    setEditingItem(null)
  }

  async function confirmDelete() {
    if (!deletingItem) return

    if (deletingItem.type === 'chat') {
      await onDeleteChat(deletingItem.id)
    } else {
      await onDeleteProject(deletingItem.id)
    }
    setDeletingItem(null)
  }

  function cancelInlineActions() {
    setEditingItem(null)
    setDeletingItem(null)
  }

  function isEditing(type, id) {
    return editingItem?.type === type && editingItem?.id === id
  }

  function isDeleting(type, id) {
    return deletingItem?.type === type && deletingItem?.id === id
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="brand-row">
          <span className="brand-logo">✦</span>
          <span className="brand-text">ChatGPT</span>
        </div>
        <button type="button" className="ghost-btn" onClick={onCloseMobile}>✕</button>
      </div>

      <div className="quick-actions">
        <button type="button" className="quick-item" onClick={onQuickCreateChat} disabled={loading}>✎ Новый чат</button>
        <button type="button" className="quick-item" onClick={() => searchInputRef.current?.focus()}>
          ⌕ Поиск в чатах
        </button>
      </div>

      <div className="chat-search">
        <input
          ref={searchInputRef}
          type="search"
          value={chatSearchQuery}
          onChange={(e) => setChatSearchQuery(e.target.value)}
          placeholder="Поиск по названию чата"
          aria-label="Поиск в чатах"
        />
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
          {projects.map((project) => {
            const key = menuKey('project', project.projectId)
            const editing = isEditing('project', project.projectId)
            const deleting = isDeleting('project', project.projectId)

            return (
              <div key={project.projectId} className="stack-row">
                {editing ? (
                  <input
                    className="stack-inline-input"
                    value={editingItem?.draft || ''}
                    onChange={(e) => setEditingItem((prev) => (prev ? { ...prev, draft: e.target.value } : prev))}
                    maxLength={120}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveRename()
                      if (e.key === 'Escape') cancelInlineActions()
                    }}
                    autoFocus
                  />
                ) : (
                  <button
                    className={selectedProjectId === project.projectId ? 'stack-item active' : 'stack-item'}
                    type="button"
                    onClick={() => setSelectedProjectId(project.projectId)}
                    disabled={deleting}
                  >
                    ▣ {project.title}
                  </button>
                )}

                {editing || deleting ? (
                  <div className="stack-inline-actions">
                    <button type="button" onClick={editing ? saveRename : confirmDelete} aria-label="Подтвердить">✓</button>
                    <button type="button" onClick={cancelInlineActions} aria-label="Отмена">✕</button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="stack-menu-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenMenu((prev) => (prev === key ? null : key))
                    }}
                    aria-label={`Меню проекта ${project.title}`}
                  >
                    ⋯
                  </button>
                )}

                {openMenu === key ? (
                  <div className="stack-menu">
                    <button type="button" onClick={() => startRename('project', project)}>Переименовать</button>
                    <button type="button" className="danger" onClick={() => startDelete('project', project)}>Удалить</button>
                  </div>
                ) : null}
              </div>
            )
          })}
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
          {visibleChats.map((chat) => {
            const key = menuKey('chat', chat.chatId)
            const editing = isEditing('chat', chat.chatId)
            const deleting = isDeleting('chat', chat.chatId)

            return (
              <div key={chat.chatId} className="stack-row">
                {editing ? (
                  <input
                    className="stack-inline-input"
                    value={editingItem?.draft || ''}
                    onChange={(e) => setEditingItem((prev) => (prev ? { ...prev, draft: e.target.value } : prev))}
                    maxLength={120}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveRename()
                      if (e.key === 'Escape') cancelInlineActions()
                    }}
                    autoFocus
                  />
                ) : (
                  <button
                    className={selectedChatId === chat.chatId ? 'stack-item active' : 'stack-item'}
                    type="button"
                    onClick={() => {
                      setSelectedChatId(chat.chatId)
                      onCloseMobile()
                    }}
                    disabled={deleting}
                  >
                    ◦ {chat.title}
                  </button>
                )}

                {editing || deleting ? (
                  <div className="stack-inline-actions">
                    <button type="button" onClick={editing ? saveRename : confirmDelete} aria-label="Подтвердить">✓</button>
                    <button type="button" onClick={cancelInlineActions} aria-label="Отмена">✕</button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="stack-menu-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenMenu((prev) => (prev === key ? null : key))
                    }}
                    aria-label={`Меню чата ${chat.title}`}
                  >
                    ⋯
                  </button>
                )}

                {openMenu === key ? (
                  <div className="stack-menu">
                    <button type="button" onClick={() => startRename('chat', chat)}>Переименовать</button>
                    <button type="button" className="danger" onClick={() => startDelete('chat', chat)}>Удалить</button>
                  </div>
                ) : null}
              </div>
            )
          })}
          {!visibleChats.length ? <div className="muted">Чаты не найдены</div> : null}
        </div>
      </section>

      <div className="sidebar-footer">
        <div className="profile-name">{me?.username || me?.email}</div>
        <button type="button" onClick={onLogout}>Выйти</button>
      </div>
    </aside>
  )
}
