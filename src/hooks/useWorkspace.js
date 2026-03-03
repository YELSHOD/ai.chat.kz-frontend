import { useEffect, useRef, useState } from 'react'

export function useWorkspace({ request, streamRequest, enabled }) {
  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState('personal')

  const [chats, setChats] = useState([])
  const [selectedChatId, setSelectedChatId] = useState('')

  const [messages, setMessages] = useState([])
  const [messagesByDay, setMessagesByDay] = useState([])
  const [groupByDay, setGroupByDay] = useState(false)

  const [fromDate, setFromDate] = useState(defaultDate(-6))
  const [toDate, setToDate] = useState(defaultDate(0))

  const [streaming, setStreaming] = useState(false)
  const [streamPreview, setStreamPreview] = useState('')
  const streamControllerRef = useRef(null)
  const typingTimerRef = useRef(null)
  const pendingDeltaRef = useRef('')
  const lastChatsRefreshAtRef = useRef(0)
  const chatsRefreshInFlightRef = useRef(false)

  function resetWorkspace() {
    setProjects([])
    setSelectedProjectId('personal')
    setChats([])
    setSelectedChatId('')
    setMessages([])
    setMessagesByDay([])
    stopStream()
  }

  async function loadProjects() {
    const data = await request('/api/projects', { method: 'GET' })
    setProjects(Array.isArray(data) ? data : [])
  }

  async function createProject(title) {
    const created = await request('/api/projects', {
      method: 'POST',
      body: { title },
    })

    setProjects((prev) => [created, ...prev])
    setSelectedProjectId(created.projectId)
    return created
  }

  async function renameProject(projectId, title) {
    await request(`/api/projects/${projectId}`, {
      method: 'PATCH',
      body: { title },
    })
    await loadProjects()
  }

  async function deleteProject(projectId) {
    await request(`/api/projects/${projectId}`, { method: 'DELETE' })

    if (selectedProjectId === projectId) {
      setSelectedProjectId('personal')
      setSelectedChatId('')
      setMessages([])
      setMessagesByDay([])
    }

    await loadProjects()
  }

  async function loadChats() {
    const path =
      selectedProjectId === 'personal'
        ? '/api/chats'
        : `/api/projects/${selectedProjectId}/chats`

    const data = await request(path, { method: 'GET' })
    const list = Array.isArray(data) ? data : []
    setChats(list)

    if (!list.some((c) => c.chatId === selectedChatId)) {
      setSelectedChatId(list[0]?.chatId || '')
    }
  }

  async function createChat(title) {
    const path =
      selectedProjectId === 'personal'
        ? '/api/chats'
        : `/api/projects/${selectedProjectId}/chats`

    const created = await request(path, {
      method: 'POST',
      body: { title: title?.trim() || null },
    })

    await loadChats()
    setSelectedChatId(created.chatId)
    return created
  }

  async function renameChat(chatId, title) {
    await request(`/api/chats/${chatId}`, {
      method: 'PATCH',
      body: { title },
    })
    await loadChats()
  }

  async function deleteChat(chatId) {
    await request(`/api/chats/${chatId}`, { method: 'DELETE' })
    if (selectedChatId === chatId) {
      setSelectedChatId('')
      setMessages([])
      setMessagesByDay([])
    }
    await loadChats()
  }

  async function chatHasMessages(chatId) {
    if (!chatId) return false
    const list = await request(`/api/chats/${chatId}/messages`, { method: 'GET' })
    return Array.isArray(list) && list.length > 0
  }

  async function loadMessages(chatId) {
    if (!chatId) {
      setMessages([])
      setMessagesByDay([])
      return
    }

    if (groupByDay) {
      const grouped = await request(
        `/api/chats/${chatId}/messages/by-day?from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}&tz=Asia/Almaty`,
        { method: 'GET' },
      )

      const normalized = Array.isArray(grouped) ? grouped : []
      setMessagesByDay(normalized)
      setMessages(normalized.flatMap((g) => g.messages || []))
      return
    }

    const list = await request(`/api/chats/${chatId}/messages`, { method: 'GET' })
    const normalized = Array.isArray(list) ? list : []
    setMessages(normalized)
    setMessagesByDay([])
  }

  async function sendUserMessage(chatId, content) {
    await generateStream(chatId, content, null)
  }

  async function generateStream(chatId, prompt, systemPrompt) {
    stopStream()

    const controller = new AbortController()
    streamControllerRef.current = controller
    setStreaming(true)
    setStreamPreview('')
    pendingDeltaRef.current = ''
    startTypingTicker()
    maybeRefreshChatsTitle(true)

    try {
      await streamRequest({
        chatId,
        prompt,
        systemPrompt,
        onDelta: (delta) => {
          pendingDeltaRef.current += delta
          maybeRefreshChatsTitle()
        },
        signal: controller.signal,
      })

      await waitForPendingDelta(3000)
      await loadMessages(chatId)
      maybeRefreshChatsTitle(true)
    } finally {
      stopTypingTicker()
      streamControllerRef.current = null
      setStreaming(false)
    }
  }

  function maybeRefreshChatsTitle(force = false) {
    const now = Date.now()
    if (!force && now - lastChatsRefreshAtRef.current < 1200) return
    if (chatsRefreshInFlightRef.current) return

    lastChatsRefreshAtRef.current = now
    chatsRefreshInFlightRef.current = true

    loadChats()
      .catch(() => {})
      .finally(() => {
        chatsRefreshInFlightRef.current = false
      })
  }

  function stopStream() {
    if (streamControllerRef.current) {
      streamControllerRef.current.abort()
    }
    streamControllerRef.current = null
    pendingDeltaRef.current = ''
    stopTypingTicker()
    setStreaming(false)
  }

  function startTypingTicker() {
    stopTypingTicker()
    typingTimerRef.current = setInterval(() => {
      if (!pendingDeltaRef.current.length) {
        return
      }

      const nextChar = pendingDeltaRef.current.charAt(0)
      pendingDeltaRef.current = pendingDeltaRef.current.slice(1)
      setStreamPreview((prev) => prev + nextChar)
    }, 18)
  }

  function stopTypingTicker() {
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current)
      typingTimerRef.current = null
    }
  }

  function waitForPendingDelta(timeoutMs) {
    return new Promise((resolve) => {
      const startedAt = Date.now()
      const timer = setInterval(() => {
        const timeoutReached = Date.now() - startedAt >= timeoutMs
        if (!pendingDeltaRef.current.length || timeoutReached) {
          clearInterval(timer)
          resolve()
        }
      }, 25)
    })
  }

  useEffect(() => {
    if (!enabled) return
    loadProjects().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    loadChats().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, selectedProjectId])

  useEffect(() => {
    if (!enabled || !selectedChatId) {
      setMessages([])
      setMessagesByDay([])
      return
    }

    loadMessages(selectedChatId).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, selectedChatId, groupByDay, fromDate, toDate])

  useEffect(() => {
    return () => stopStream()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    projects,
    selectedProjectId,
    setSelectedProjectId,
    chats,
    selectedChatId,
    setSelectedChatId,
    messages,
    messagesByDay,
    groupByDay,
    setGroupByDay,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    streaming,
    streamPreview,
    loadProjects,
    createProject,
    renameProject,
    deleteProject,
    loadChats,
    createChat,
    renameChat,
    deleteChat,
    chatHasMessages,
    loadMessages,
    sendUserMessage,
    generateStream,
    stopStream,
    resetWorkspace,
  }
}

function defaultDate(offset) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
