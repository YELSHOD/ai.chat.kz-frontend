import { useEffect, useMemo, useState } from 'react'
import { API_BASE_URL } from './api/client'
import { AuthView } from './components/auth/AuthView'
import { ChatWorkspace } from './components/chat/ChatWorkspace'
import { Sidebar } from './components/layout/Sidebar'
import { useAuth } from './hooks/useAuth'
import { useWorkspace } from './hooks/useWorkspace'
import './styles/theme.css'

function App() {
  const { accessToken, me, isAuthed, login, register, logout } = useAuth()
  const workspace = useWorkspace({ token: accessToken, enabled: isAuthed })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [authMode, setAuthMode] = useState('login')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerUsername, setRegisterUsername] = useState('')

  const [newProjectTitle, setNewProjectTitle] = useState('')
  const [newChatTitle, setNewChatTitle] = useState('')
  const [chatSearchQuery, setChatSearchQuery] = useState('')
  const [newMessageContent, setNewMessageContent] = useState('')
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')

  const [sidebarOpen, setSidebarOpen] = useState(false)

  const selectedChat = useMemo(
    () => workspace.chats.find((chat) => chat.chatId === workspace.selectedChatId),
    [workspace.chats, workspace.selectedChatId],
  )

  useEffect(() => {
    if (workspace.selectedChatId && window.innerWidth <= 1024) setSidebarOpen(false)
  }, [workspace.selectedChatId])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  function clearFeedback() {
    setError('')
    setNotice('')
  }

  async function handleLogin(event) {
    event.preventDefault()
    setLoading(true)
    clearFeedback()

    try {
      await login(loginEmail, loginPassword)
      setNotice('Login successful')
    } catch (e) {
      setError(e.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(event) {
    event.preventDefault()
    setLoading(true)
    clearFeedback()

    try {
      await register(registerEmail, registerPassword, registerUsername)
      setAuthMode('login')
      setLoginEmail(registerEmail)
      setLoginPassword('')
      setNotice('Register successful. Please login.')
    } catch (e) {
      setError(e.message || 'Register failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateProject(event) {
    event.preventDefault()
    if (!newProjectTitle.trim()) return

    setLoading(true)
    clearFeedback()
    try {
      await workspace.createProject(newProjectTitle.trim())
      setNewProjectTitle('')
      setNotice('Project created')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function cleanupEmptySelectedChat() {
    const currentChatId = workspace.selectedChatId
    if (!currentChatId || workspace.streaming) return

    const hasMessages = await workspace.chatHasMessages(currentChatId)
    if (!hasMessages) {
      await workspace.deleteChat(currentChatId)
    }
  }

  async function createChatWithFeedback(title) {
    setLoading(true)
    clearFeedback()
    try {
      await cleanupEmptySelectedChat()
      await workspace.createChat(title)
      setNewChatTitle('')
      setNotice('Chat created')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateChat(event) {
    event.preventDefault()
    await createChatWithFeedback(newChatTitle)
  }

  async function handleQuickCreateChat() {
    await createChatWithFeedback(newChatTitle)
  }

  async function handleRenameChat(chatId, title) {
    setLoading(true)
    clearFeedback()
    try {
      await workspace.renameChat(chatId, title)
      setNotice('Chat renamed')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteChat(chatId) {
    if (!chatId) return
    setLoading(true)
    clearFeedback()
    try {
      await workspace.deleteChat(chatId)
      setNotice('Chat deleted')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRenameProject(projectId, title) {
    setLoading(true)
    clearFeedback()
    try {
      await workspace.renameProject(projectId, title)
      setNotice('Project renamed')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteProject(projectId) {
    if (!projectId) return

    setLoading(true)
    clearFeedback()
    try {
      await workspace.deleteProject(projectId)
      setNotice('Project deleted')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSendUserMessage() {
    if (!workspace.selectedChatId || !newMessageContent.trim()) return

    setLoading(true)
    clearFeedback()
    try {
      await workspace.sendUserMessage(workspace.selectedChatId, newMessageContent.trim())
      setNewMessageContent('')
      setNotice('Response generated')
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    workspace.resetWorkspace()
    logout()
    clearFeedback()
  }

  function handleToggleTheme() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  function handleProfileClick() {
    setNotice(`Profile: ${me?.username || me?.email || 'User'}`)
    setError('')
  }

  function handleAuthModeChange(nextMode) {
    setAuthMode(nextMode)
    clearFeedback()
  }

  if (!isAuthed) {
    return (
      <AuthView
        mode={authMode}
        onModeChange={handleAuthModeChange}
        loading={loading}
        loginEmail={loginEmail}
        setLoginEmail={setLoginEmail}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        registerUsername={registerUsername}
        setRegisterUsername={setRegisterUsername}
        registerEmail={registerEmail}
        setRegisterEmail={setRegisterEmail}
        registerPassword={registerPassword}
        setRegisterPassword={setRegisterPassword}
        onLogin={handleLogin}
        onRegister={handleRegister}
        apiBaseUrl={API_BASE_URL}
        error={error}
        notice={notice}
      />
    )
  }

  return (
    <div className="app-shell">
      <div className={`sidebar-layer ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      <div className={`sidebar-wrap ${sidebarOpen ? 'open' : ''}`}>
        <Sidebar
          me={me}
          loading={loading || workspace.streaming}
          newProjectTitle={newProjectTitle}
          setNewProjectTitle={setNewProjectTitle}
          onCreateProject={handleCreateProject}
          selectedProjectId={workspace.selectedProjectId}
          setSelectedProjectId={workspace.setSelectedProjectId}
          projects={workspace.projects}
          onRenameProject={handleRenameProject}
          onDeleteProject={handleDeleteProject}
          newChatTitle={newChatTitle}
          setNewChatTitle={setNewChatTitle}
          onCreateChat={handleCreateChat}
          onQuickCreateChat={handleQuickCreateChat}
          chats={workspace.chats}
          onRenameChat={handleRenameChat}
          onDeleteChat={handleDeleteChat}
          chatSearchQuery={chatSearchQuery}
          setChatSearchQuery={setChatSearchQuery}
          selectedChatId={workspace.selectedChatId}
          setSelectedChatId={workspace.setSelectedChatId}
          onLogout={handleLogout}
          onCloseMobile={() => setSidebarOpen(false)}
        />
      </div>

      <ChatWorkspace
        selectedChatId={workspace.selectedChatId}
        selectedChatTitle={selectedChat?.title}
        me={me}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onProfileClick={handleProfileClick}
        loading={loading}
        streaming={workspace.streaming}
        groupByDay={workspace.groupByDay}
        setGroupByDay={workspace.setGroupByDay}
        fromDate={workspace.fromDate}
        setFromDate={workspace.setFromDate}
        toDate={workspace.toDate}
        setToDate={workspace.setToDate}
        onLoadByDay={() => workspace.loadMessages(workspace.selectedChatId)}
        messages={workspace.messages}
        messagesByDay={workspace.messagesByDay}
        streamPreview={workspace.streamPreview}
        onStopStream={workspace.stopStream}
        newMessageContent={newMessageContent}
        setNewMessageContent={setNewMessageContent}
        onSendUserMessage={handleSendUserMessage}
        error={error}
        notice={notice}
        onOpenSidebar={() => setSidebarOpen(true)}
      />
    </div>
  )
}

export default App
