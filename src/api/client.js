export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')

export async function apiRequest(path, { method = 'GET', token, body, headers = {} } = {}) {
  const requestHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.error || `Request failed: ${response.status}`)
  }

  return payload
}

export async function streamGenerate({ chatId, token, prompt, systemPrompt, onDelta, signal }) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}/generate/stream`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt: prompt?.trim() || null,
      systemPrompt: systemPrompt?.trim() || null,
    }),
    signal,
  })

  if (!response.ok || !response.body) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || 'Stream generation failed')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    let separatorIndex = buffer.indexOf('\n\n')

    while (separatorIndex !== -1) {
      const chunk = buffer.slice(0, separatorIndex)
      buffer = buffer.slice(separatorIndex + 2)

      const lines = chunk.split('\n')
      let eventName = 'message'
      let dataValue = ''

      for (const line of lines) {
        if (line.startsWith('event:')) eventName = line.slice(6).trim()
        if (line.startsWith('data:')) dataValue += line.slice(5).trim()
      }

      if (eventName === 'delta') onDelta(dataValue)
      if (eventName === 'error') throw new Error(dataValue || 'Stream generation failed')

      separatorIndex = buffer.indexOf('\n\n')
    }
  }
}
