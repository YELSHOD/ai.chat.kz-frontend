# ai.chat.kz Frontend

React + Vite frontend for `ai.chat.kz` backend.

## Tech
- React 19
- Vite 7
- Plain CSS (component-based structure)

## Features
- Auth: login/register
- Projects and chats in ChatGPT-like sidebar
- Chat messages and by-day view
- Streaming assistant response (SSE)
- Dark/Light theme toggle
- Enter to send (`Shift+Enter` for newline)

## Requirements
- Node.js 20+ (recommended)
- npm 10+

## Setup
```bash
npm install
cp .env.example .env
```

## Environment
Use `.env` for local values:

```bash
VITE_API_BASE_URL=http://localhost:8080
```

## Run
```bash
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Lint
```bash
npm run lint
```

## Project structure
```text
src/
  api/
  hooks/
  components/
    auth/
    chat/
    common/
    layout/
  styles/
```

## Backend compatibility
Expected backend base URL: `http://localhost:8080`

Main endpoints used:
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/chats`
- `POST /api/chats`
- `GET /api/chats/{chatId}/messages`
- `GET /api/chats/{chatId}/messages/by-day`
- `POST /api/chats/{chatId}/generate/stream`

