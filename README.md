# 🛍️ ShopAssist AI

An intelligent, AI-powered e-commerce customer support platform featuring **Retrieval-Augmented Generation (RAG)**, **Agentic Tool Calling**, and **Role-Based Access Control (RBAC)**.

ShopAssist utilizes advanced AI orchestration to read company policies from a vector database and interact with live Postgres database records (like fetching order statuses or generating support tickets) to provide seamless, autonomous customer support.

🚀 **Live Demo:** [https://shop-assist-alpha.vercel.app/](https://shop-assist-alpha.vercel.app/)

---

## 🔑 Test Accounts
Feel free to test the live application using the credentials below to experience the different security roles:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@shopassist.com` | `admin123` |
| **User** | Create your own! | Anything |

*(Note: Test Order `ORD-1002` exists in the database. Ask the AI about it!)*

---

## 🎯 Role Functionalities

### 👤 Standard User (Customer)
- **Authentication**: Can sign up, log in, and securely access the platform.
- **AI Chat Agent**: Can interact with the ShopAssist AI to:
  - **Query Policies**: Ask questions about returns, shipping, and warranties (RAG powered by Pinecone).
  - **Track Orders**: Ask for the status of an order like `ORD-1002` (Tool Calling to PostgreSQL).
  - **File Tickets**: Complain about an issue to have the AI automatically generate a support ticket on their behalf.
- **Security Limitation**: Cannot access or even see any backend management tabs.

### 🛡️ Administrator
- **All User Features**: Can chat with the AI and test the frontend.
- **Orders Dashboard**: Can view the backend relational database of all customer orders.
- **Tickets Dashboard**: Can view, manage, and resolve AI-generated customer support tickets.
- **Knowledge Base Dashboard**: Can edit the Markdown-based company policies. Changes are dynamically re-embedded and synchronized with the Pinecone Vector Database in real-time.
- **System Logs**: Can monitor the AI's "Chain of Thought", execution steps, and tool calls.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, Lucide React |
| **Backend API** | Node.js, Express, JWT Auth |
| **Database** | **Neon** (Serverless PostgreSQL) via Prisma ORM |
| **AI / LLM** | Google Gemini (3.6-flash) |
| **Agent Orchestration** | LangGraph JS |
| **Vector Database** | Pinecone |

---

## ⚙️ Local Development

### Prerequisites
- Node.js (v18+)
- Neon PostgreSQL Database URL
- Google Gemini API key
- Pinecone API key

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
npm install
```

**Configure your `backend/.env` file:**
```env
DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require"
GEMINI_API_KEY="your-gemini-key"
PINECONE_API_KEY="your-pinecone-key"
PINECONE_INDEX="shopassist-ai"
JWT_SECRET="your-secure-jwt-secret"
```

**Initialize Database & Start Server:**
```bash
npx prisma db push
node seed_neon.js  # Optional: Seeds test admin and ORD-1002
npm run dev
```
*(Backend runs on `http://localhost:3000`)*

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
*(Frontend runs on `http://localhost:5173`)*

---

## 🏗️ Architecture & Security
- **Decoupled Architecture**: The React frontend and Express backend are strictly separated, communicating via a RESTful API.
- **Secure Authentication**: All endpoints except the public login/signup are guarded by HTTP Bearer JSON Web Tokens (JWT).
- **Strict RBAC**: API Endpoints for Orders, Tickets, and Knowledge Base enforce strict `admin` role validation before executing Prisma queries.
- **Rate Limiting**: AI endpoints are rate-limited to prevent LLM quota exhaustion and abuse.
- **Data Redaction**: The AI Tool-Calling layer dynamically redacts sensitive PII (like customer names and exact monetary amounts) before handing database context to the LLM.
