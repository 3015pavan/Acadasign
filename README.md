# Acadasign

<p align="center">
  <strong>AI-native assessment creation for modern classrooms.</strong><br />
  Generate polished question papers, OCR uploaded notes/screenshots, stream progress in real time, and export production-ready PDFs.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Tech%20Stack-Next.js%20%7C%20Node.js%20%7C%20MongoDB%20%7C%20Redis%20%7C%20BullMQ-0f172a?style=for-the-badge" alt="Tech Stack" />
  <img src="https://img.shields.io/badge/Status-Beta%20%7C%20Production--ready%20core-7c5c46?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/PRs-Welcome-16a34a?style=for-the-badge" alt="PRs Welcome" />
  <img src="https://img.shields.io/badge/License-Private%20%2F%20TBD-64748b?style=for-the-badge" alt="License" />
</p>

---

## Overview

Acadasign is a full-stack AI SaaS for teachers, schools, and education teams that need to create assessment papers quickly without sacrificing quality.

It combines a polished Next.js experience with an Express backend, BullMQ workers, MongoDB persistence, Redis caching, authenticated PDF generation, Socket.io live updates, and OCR-based source extraction for images and screenshots.

---

## Product Vision

Assessment creation is still too manual in most schools. Teachers spend hours extracting content, writing questions, formatting PDFs, and re-checking output for consistency.

VedaAI reduces that workload by turning source material into structured question papers with one flow:

1. Upload a PDF, text file, or image.
2. Extract the source text with PDF parsing or OCR.
3. Generate a structured paper with balanced difficulty.
4. Stream live progress to the UI.
5. Review, regenerate, copy a link, or download a PDF.

The goal is simple: make assessment generation feel like a modern AI product, not a form-filling tool.

---

## Architecture

```mermaid
flowchart LR
  U[Teacher / Admin] --> F[Next.js Frontend]
  F -->|REST + cookies| A[Express API]
  F <-->|Socket.io| S[Realtime Events]
  A --> M[(MongoDB Atlas)]
  A --> R[(Redis)]
  A --> Q[BullMQ Queue]
  Q --> W[BullMQ Worker]
  W --> O[OCR / PDF parsing]
  W --> L[LLM Provider]
  W --> M
  W --> R
  W --> S
  F --> P[Authenticated PDF Endpoint]
```

### High-Level Flow

```text
Upload source material
        ↓
Extract text (PDF / OCR / plain text)
        ↓
Build a grounded prompt with rules
        ↓
Queue generation job via BullMQ
        ↓
Worker generates structured paper
        ↓
Persist to MongoDB + cache in Redis
        ↓
Stream progress over Socket.io
        ↓
Render exam paper + secure PDF export
```

---

## Tech Stack

| Layer | Tools | Purpose |
|---|---|---|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS, Zustand, Framer Motion | Premium SaaS UI, routing, state, interactions |
| Backend | Node.js, Express, TypeScript | API, auth, assignments, results, PDF route |
| Database | MongoDB + Mongoose | Persistent assignment/result storage |
| Cache / Queue | Redis + BullMQ | Async paper generation and fast status updates |
| Realtime | Socket.io | Live progress + completion events |
| PDFs | Puppeteer | Render printable exam papers |
| OCR | Tesseract.js | Extract text from images/screenshots |
| AI | Gemini / OpenAI / Anthropic compatible layer | Source-grounded generation |

---

## Core Features

- **AI question paper generation** with structured sections, mark allocation, and difficulty balancing.
- **OCR for images and screenshots** so scanned notes can be converted into usable source text.
- **Grounded prompt design** that discourages generic “notes-style” questions.
- **Authenticated PDF export** that downloads the actual file instead of opening a blank tab.
- **Realtime generation feedback** using Socket.io and BullMQ.
- **Modern glass UI** built to feel like a serious startup product.
- **Regenerate flow** for quick iteration when the first output needs refinement.
- **Copy link and share workflow** for output pages.

---

## AI Pipeline

The generation pipeline is intentionally layered so quality and reliability stay high.

1. **Input normalization**
   - The backend receives uploaded text, PDF, or image content.
   - Images are processed with OCR.
   - PDFs are extracted into text.

2. **Concept extraction**
   - Source text is reduced into reusable concepts.
   - The generator avoids weak stems and vague wording.

3. **Prompt construction**
   - The system adds explicit writing rules.
   - JSON-only output is requested.
   - The prompt reinforces grounding in the uploaded material.

4. **Model generation**
   - The selected model returns structured paper JSON.
   - Invalid output can fall back to a deterministic generator.

5. **Post-processing**
   - Sections, marks, and options are normalized.
   - The result is persisted and cached.

---

## WebSocket + BullMQ Workflow

```mermaid
sequenceDiagram
  participant UI as Frontend
  participant API as Express API
  participant Q as BullMQ Queue
  participant W as Worker
  participant DB as MongoDB
  participant WS as Socket.io

  UI->>API: Create assignment
  API->>Q: Enqueue job
  UI->>WS: Subscribe to assignment channel
  Q->>W: Worker receives job
  W->>WS: generation:progress
  W->>DB: Save partial/final result
  W->>WS: generation:complete
  UI->>API: Fetch result / download PDF
```

The queue keeps request latency low while the worker handles the heavier AI, OCR, and PDF tasks.

---

## Frontend Architecture

The frontend uses the Next.js App Router with a clean separation between screens, UI primitives, and shared logic.

### Main Areas

- `frontend/src/app/` - routes, layout, and top-level screens
- `frontend/src/components/` - UI components, output screens, forms, and layout shells
- `frontend/src/context/` - user and toast state providers
- `frontend/src/lib/` - API client, socket helpers, validators, and utilities
- `frontend/src/store/` - lightweight client-side assignment state

### UI Design Principles

- Glassmorphism instead of flat admin styling.
- Soft warm neutrals instead of aggressive orange-only accents.
- Clear hierarchy for teachers using the app on large and small screens.
- Responsive navigation with a desktop shell and mobile bottom bar.

---

## Screenshots

Add your final product screenshots here before launch.

```text
![Dashboard](docs/screenshots/dashboard.png)
![Create Assignment](docs/screenshots/create-assignment.png)
![Output View](docs/screenshots/output-view.png)
![Mobile View](docs/screenshots/mobile-view.png)
```

Suggested captures:

- Dashboard / analytics
- Create assignment form
- Generated exam paper view
- PDF download state
- Mobile bottom navigation

---

## Folder Structure

```text
vedaai/
├── frontend/
│   └── src/
│       ├── app/
│       ├── components/
│       ├── context/
│       ├── lib/
│       ├── store/
│       └── types/
├── backend/
│   └── src/
│       ├── config/
│       ├── lib/
│       ├── middleware/
│       ├── models/
│       ├── queue/
│       ├── routes/
│       ├── services/
│       ├── types/
│       └── workers/
├── .env.example
├── package.json
├── prompt.md
└── README.md
```

---

## API Documentation

### Authentication

The backend uses auth-protected routes with cookies and bearer token support in the frontend client.

### Assignments

#### `POST /api/assignments`

Creates a new assignment and queues generation.

Response:

```json
{
  "success": true,
  "assignmentId": "string",
  "jobId": "string"
}
```

#### `GET /api/assignments/:id`

Returns the saved assignment metadata.

#### `POST /api/assignments/:id/regenerate`

Queues a fresh generation job.

### Results

#### `GET /api/results/:assignmentId`

Returns the generation status and paper payload.

### PDF

#### `GET /api/pdf/:assignmentId`

Returns a real PDF download with attachment headers.

### Users

#### `GET /api/users/me`

Returns the current authenticated user.

#### `PATCH /api/users/me`

Updates the current user profile.

---

## Installation

### Prerequisites

- Node.js 18+ or current LTS
- MongoDB Atlas or local MongoDB
- Redis or Redis Cloud
- One AI provider key

### Install Dependencies

```bash
npm install --legacy-peer-deps
```

### Environment Setup

Copy the root example file and create a frontend env file:

```bash
copy .env.example .env
```

Create `frontend/.env.local` manually with the frontend values below.

---

## Environment Variables

### Root / Backend

```env
PORT=5000
MONGODB_URI=mongodb+srv://301pavan2005_db_user:teq2ePJdJ3d238Nk@clustero.ztoyfcs.mongodb.net/?appName=Cluster
REDIS_URL=redis://localhost:6380
GEMINI_API_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
FRONTEND_URL=http://localhost:3000
```

### Frontend

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=http://localhost:5000
NEXT_IGNORE_INCORRECT_LOCKFILE=1
```

`NEXT_IGNORE_INCORRECT_LOCKFILE=1` is kept because the Windows/npm combination in this workspace can trigger Next.js lockfile warnings even when the app builds correctly.

---

## Local Development

### Run Everything

```bash
npm run dev
```

### Run Individually

```bash
npm run dev --workspace frontend
npm run dev --workspace backend
```

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

---

## Deployment Architecture

Recommended production setup:

- **Frontend**: Vercel
- **Backend**: Render, Railway, Fly.io, or a VPS
- **Database**: MongoDB Atlas
- **Queue/Cache**: Redis Cloud

```mermaid
flowchart LR
  Browser --> Vercel[Frontend on Vercel]
  Vercel --> Backend[Express API + Worker Host]
  Backend --> Atlas[(MongoDB Atlas)]
  Backend --> Redis[(Redis Cloud)]
  Backend --> AI[LLM Provider]
  Backend --> PDF[Puppeteer PDF Renderer]
```

### Production Steps

1. Push the repo to GitHub.
2. Connect the frontend workspace to Vercel.
3. Deploy the backend workspace to your Node host.
4. Add MongoDB, Redis, and AI secrets in the backend environment.
5. Point `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` to the backend URL.
6. Point `FRONTEND_URL` to the deployed frontend URL.

---

## Migration & Redeploy (Quick Steps)

If you see legacy assignments appearing across accounts or `/api/pdf` returning 500s after deployment, perform these steps on your backend host:

- Ensure the latest `main` is deployed (pull `origin/main` and restart the service).
- Flag legacy assignments (those created before `userId` was enforced) so they don't surface to regular users:

```bash
# from the repository root, with proper env vars set (MONGO_URI or MONGODB_URI)
cd backend
node scripts/migrate-legacy-assignments.js
```

- After migration, restart the backend so route protections and the PDF fallback are active.
- Monitor server logs for `Primary PDF renderer failed` warnings — the emergency fallback is enabled and will return a simple PDF when the primary renderer fails.

Contact the maintainer if you need a one-off data migration that assigns legacy documents to specific owners.

7. Confirm WebSocket upgrade support and PDF downloads.

### Production Commands

Frontend:

```bash
npm run build --workspace frontend
npm run start --workspace frontend
```

Backend:

```bash
npm run build --workspace backend
npm run start --workspace backend
```

---

## Scalability Considerations

- BullMQ keeps generation jobs off the request path.
- Redis reduces repeat reads for recently generated outputs.
- MongoDB stores durable assignment state and results.
- Socket.io gives responsive progress updates without polling.
- The PDF flow is isolated from the main UI request cycle.
- The backend can be horizontally scaled if Redis and MongoDB are shared.

---

## Security Best Practices

- Keep secrets out of GitHub; use environment variables only.
- Use authenticated PDF downloads instead of public links.
- Restrict CORS to the real frontend origin.
- Enforce HTTPS in production.
- Treat uploads as untrusted input.
- Use rate limiting on API routes.
- Preserve teacher/user session boundaries.

---

## Performance Optimizations

- Asynchronous generation via BullMQ.
- Cached results in Redis.
- Blob-based PDF download to avoid blank-tab failures.
- OCR only runs when image input is provided.
- Client-side state is lightweight and targeted.
- The app shell uses shared primitives to reduce duplication.

---

## Roadmap

- [ ] Add richer assignment analytics and topic insights
- [ ] Add version history for generated papers
- [ ] Add export templates for different school formats
- [ ] Add collaboration / reviewer comments
- [ ] Add stronger OCR worker reuse and performance tuning
- [ ] Add template marketplace for subject-specific assessment styles
- [ ] Add multi-tenant organization support

