# ShopAssist AI

AI-Powered Customer Support Assistant for E-commerce using RAG and grounded responses.

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, Lucide React |
| **Backend** | Node.js, Express |
| **Database** | Supabase PostgreSQL via Prisma ORM |
| **AI / LLM** | Google Gemini 2.0 Flash |
| **Vector DB** | Pinecone |
| **Knowledge Base** | Markdown files (RAG pipeline) |

## Architecture

```
Browser → React/Vite (localhost:5173) → /api/* proxy → Express (localhost:3000)
```

- Frontend and backend are completely separated
- Frontend communicates with backend only through REST API calls
- Backend handles all AI, database, and RAG operations

## Getting Started

### Prerequisites

- Node.js (v18+)
- Supabase PostgreSQL database
- Google Gemini API key
- Pinecone API key and index

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in your API keys and database URLs in .env
npm install
npx prisma generate
npm run dev
```

Backend runs at: `http://localhost:3000`

Health check: `GET http://localhost:3000/api/health`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

### Environment Variables

All environment variables belong in `backend/.env`:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase pooled connection string |
| `DIRECT_URL` | Supabase direct connection string |
| `GEMINI_API_KEY` | Google Gemini API key |
| `PINECONE_API_KEY` | Pinecone API key |
| `PINECONE_INDEX` | Pinecone index name |

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System health check |
| `POST` | `/api/chat` | AI chat with RAG pipeline |
| `GET` | `/api/orders` | List all orders |
| `GET` | `/api/orders/:id` | Get order by ID |
| `GET` | `/api/tickets` | List support tickets |
| `POST` | `/api/tickets` | Create support ticket |
| `PATCH` | `/api/tickets/:id` | Update ticket status |
| `GET` | `/api/knowledge` | List knowledge documents |
| `PUT` | `/api/knowledge/:id` | Update knowledge document |
| `GET` | `/api/logs` | System execution logs |

## Project Structure

```
ShopAssist/
├── frontend/          # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css
│   │   └── components/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── backend/           # Node.js + Express API
│   ├── lib/           # Core backend modules
│   ├── data/          # Mock/seed data
│   ├── knowledge-base/# Markdown policy documents
│   ├── prisma/        # Database schema
│   ├── server.js
│   └── package.json
│
├── .gitignore
├── README.md
└── metadata.json
```
