export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, details = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = details.status || 0
    this.errorCode = details.errorCode || ''
    this.error = details.error || message
    this.payload = details.payload
  }
}

function decodePayload(response, rawText) {
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(rawText)
    } catch {
      return {}
    }
  }

  return rawText || {}
}

function toErrorMessage(payload, fallback) {
  if (!payload) return fallback
  if (typeof payload === 'string') return payload || fallback
  return payload.error || payload.message || fallback
}

export async function apiRequest(path, { method = 'GET', token, body, headers = {}, signal } = {}) {
  const requestHeaders = {
    ...headers,
  }

  const hasBody = body !== undefined
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData

  if (hasBody && !isFormData && !requestHeaders['Content-Type']) {
    requestHeaders['Content-Type'] = 'application/json'
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: requestHeaders,
    body: hasBody ? (isFormData ? body : JSON.stringify(body)) : undefined,
    signal,
  })

  const rawText = await response.text()
  const payload = decodePayload(response, rawText)

  if (!response.ok) {
    throw new ApiError(toErrorMessage(payload, `Request failed: ${response.status}`), {
      status: response.status,
      errorCode: typeof payload === 'object' ? payload.errorCode || '' : '',
      error: typeof payload === 'object' ? payload.error || '' : '',
      payload,
    })
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
    throw new ApiError(body.error || 'Stream generation failed', {
      status: response.status,
      errorCode: body.errorCode || '',
      error: body.error || '',
      payload: body,
    })
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
      if (eventName === 'error') {
        throw new ApiError(dataValue || 'Stream generation failed')
      }

      separatorIndex = buffer.indexOf('\n\n')
    }
  }
}
