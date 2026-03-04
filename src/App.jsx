import { useEffect, useMemo, useRef, useState } from 'react'
import { AuthRouter } from './components/auth/AuthRouter'
import { ChatWorkspace } from './components/chat/ChatWorkspace'
import { Sidebar } from './components/layout/Sidebar'
import { parseOAuthCallbackHash } from './auth/oauth'
import { AUTH_ROUTES, isAuthRoute } from './auth/routes'
import { useAppRoute } from './hooks/useAppRoute'
import { useAuth } from './hooks/useAuth'
import { useWorkspace } from './hooks/useWorkspace'
import './styles/theme.css'

function toErrorMessage(error, fallback) {
  const message = error?.error || error?.message || fallback
  const errorCode = error?.errorCode || ''

  if (!message) return fallback
  return errorCode ? `${message} (${errorCode})` : message
}

function queryParam(search, key) {
  const params = new URLSearchParams(search || '')
  return params.get(key) || ''
}

function normalizeAuthRoute(pathname) {
  if (pathname === '/' || !isAuthRoute(pathname)) {
    return AUTH_ROUTES.login
  }

  return pathname
}

function App() {
  const route = useAppRoute()
  const oauthProcessedRef = useRef('')

  const {
    me,
    isAuthed,
    login,
    register,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    completeOAuth,
    buildOAuthUrl,
    logout,
    authorizedRequest,
    authorizedStreamGenerate,
  } = useAuth()

  const workspace = useWorkspace({
    request: authorizedRequest,
    streamRequest: authorizedStreamGenerate,
    enabled: isAuthed,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [newProjectTitle, setNewProjectTitle] = useState('')
  const [newChatTitle, setNewChatTitle] = useState('')
  const [chatSearchQuery, setChatSearchQuery] = useState('')
  const [newMessageContent, setNewMessageContent] = useState('')
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const selectedChat = useMemo(
    () => workspace.chats.find((chat) => chat.chatId === workspace.selectedChatId),
    [workspace.chats, workspace.selectedChatId],
  )

  const activeAuthRoute = normalizeAuthRoute(route.pathname)
  const tokenFromQuery = queryParam(route.search, 'token')

  useEffect(() => {
    if (workspace.selectedChatId && window.innerWidth <= 1024) {
      setSidebarOpen(false)
    }
  }, [workspace.selectedChatId])

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth <= 1024) {
        setSidebarCollapsed(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    if (!isAuthed) return
    if (!isAuthRoute(route.pathname)) return
    route.navigate('/', { replace: true })
  }, [isAuthed, route])

  useEffect(() => {
    if (isAuthed) return

    if (route.pathname === '/') {
      route.navigate(AUTH_ROUTES.login, { replace: true })
      return
    }

    if (!isAuthRoute(route.pathname)) {
      route.navigate(AUTH_ROUTES.login, { replace: true })
    }
  }, [isAuthed, route])

  useEffect(() => {
    if (isAuthed || route.pathname !== AUTH_ROUTES.oauthCallback) return

    const hash = route.hash || ''
    if (!hash || oauthProcessedRef.current === hash) return

    oauthProcessedRef.current = hash

    const parsed = parseOAuthCallbackHash(hash)

    if (parsed.error) {
      setError(`OAuth error: ${parsed.error}`)
      setNotice('')
      return
    }

    if (!parsed.accessToken) {
      setError('OAuth callback does not contain tokens')
      setNotice('')
      return
    }

    setLoading(true)
    setError('')
    setNotice('Completing OAuth sign-in...')

    completeOAuth(parsed)
      .then(() => {
        window.history.replaceState({}, '', AUTH_ROUTES.oauthCallback)
        setNotice('Login successful')
        route.navigate('/', { replace: true })
      })
      .catch((e) => {
        setError(toErrorMessage(e, 'OAuth login failed'))
        setNotice('')
      })
      .finally(() => setLoading(false))
  }, [completeOAuth, isAuthed, route])

  function clearFeedback() {
    setError('')
    setNotice('')
  }

  async function runWithFeedback(action, fallbackErrorMessage) {
    setLoading(true)
    clearFeedback()

    try {
      await action()
    } catch (e) {
      setError(toErrorMessage(e, fallbackErrorMessage))
    } finally {
      setLoading(false)
    }
  }

  function openRoute(path) {
    clearFeedback()
    route.navigate(path)
  }

  async function handleLogin({ email, password }) {
    await runWithFeedback(async () => {
      await login(email, password)
      setNotice('Login successful')
      route.navigate('/', { replace: true })
    }, 'Login failed')
  }

  async function handleRegister({ username, email, password }) {
    await runWithFeedback(async () => {
      await register(email, password, username)
      setNotice(`Verification email sent to ${email}`)
    }, 'Register failed')
  }

  async function handleVerifyEmail(token) {
    await runWithFeedback(async () => {
      await verifyEmail(token)
      setNotice('Email verified. Login successful.')
      route.navigate('/', { replace: true })
    }, 'Token invalid or expired')
  }

  async function handleResendVerification(email) {
    setLoading(true)
    clearFeedback()

    try {
      const safeEmail = email || me?.email || ''
      await resendVerification(safeEmail)
    } catch {
      // Intentionally suppress details to avoid account enumeration.
    } finally {
      setNotice('If the account exists, a verification link has been sent.')
      setLoading(false)
    }
  }

  async function handleForgotPassword(email) {
    setLoading(true)
    clearFeedback()

    try {
      await forgotPassword(email)
    } catch {
      // Intentionally suppress details to avoid account enumeration.
    } finally {
      setNotice('If the account exists, reset link has been sent.')
      setLoading(false)
    }
  }

  async function handleResetPassword(token, newPassword) {
    await runWithFeedback(async () => {
      await resetPassword(token, newPassword)
      setNotice('Password updated, please login again.')
      route.navigate(AUTH_ROUTES.login)
    }, 'Reset password failed')
  }

  function handleOAuth(provider) {
    window.location.href = buildOAuthUrl(provider)
  }

  async function handleCreateProject(event) {
    event.preventDefault()
    if (!newProjectTitle.trim()) return

    await runWithFeedback(async () => {
      await workspace.createProject(newProjectTitle.trim())
      setNewProjectTitle('')
      setNotice('Project created')
    }, 'Failed to create project')
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
    await runWithFeedback(async () => {
      await cleanupEmptySelectedChat()
      await workspace.createChat(title)
      setNewChatTitle('')
      setNotice('Chat created')
    }, 'Failed to create chat')
  }

  async function handleCreateChat(event) {
    event.preventDefault()
    await createChatWithFeedback(newChatTitle)
  }

  async function handleQuickCreateChat() {
    await createChatWithFeedback(newChatTitle)
  }

  async function handleRenameChat(chatId, title) {
    await runWithFeedback(async () => {
      await workspace.renameChat(chatId, title)
      setNotice('Chat renamed')
    }, 'Failed to rename chat')
  }

  async function handleDeleteChat(chatId) {
    if (!chatId) return

    await runWithFeedback(async () => {
      await workspace.deleteChat(chatId)
      setNotice('Chat deleted')
    }, 'Failed to delete chat')
  }

  async function handleRenameProject(projectId, title) {
    await runWithFeedback(async () => {
      await workspace.renameProject(projectId, title)
      setNotice('Project renamed')
    }, 'Failed to rename project')
  }

  async function handleDeleteProject(projectId) {
    if (!projectId) return

    await runWithFeedback(async () => {
      await workspace.deleteProject(projectId)
      setNotice('Project deleted')
    }, 'Failed to delete project')
  }

  async function handleSendUserMessage() {
    if (!workspace.selectedChatId || !newMessageContent.trim()) return

    await runWithFeedback(async () => {
      await workspace.sendUserMessage(workspace.selectedChatId, newMessageContent.trim())
      setNewMessageContent('')
      setNotice('Response generated')
    }, 'Failed to generate response')
  }

  function handleLogout() {
    workspace.resetWorkspace()
    logout()
    clearFeedback()
    route.navigate(AUTH_ROUTES.login, { replace: true })
  }

  function handleToggleTheme() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  function handleProfileClick() {
    setNotice(`Profile: ${me?.username || me?.email || 'User'}`)
    setError('')
  }

  if (!isAuthed) {
    return (
      <AuthRouter
        route={activeAuthRoute}
        queryToken={tokenFromQuery}
        loading={loading}
        error={error}
        notice={notice}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onVerifyEmail={handleVerifyEmail}
        onResendVerification={handleResendVerification}
        onForgotPassword={handleForgotPassword}
        onResetPassword={handleResetPassword}
        onOpenRoute={openRoute}
        onOAuth={handleOAuth}
      />
    )
  }

  return (
    <div className={sidebarCollapsed ? 'app-shell sidebar-collapsed' : 'app-shell'}>
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
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
        onOpenSidebar={() => setSidebarOpen(true)}
      />
    </div>
  )
}

export default App
