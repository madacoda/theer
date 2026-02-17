# 🧠 AI Support Triage & Recovery Hub

A high-performance backend system that ingests user complaints and asynchronously processes them using LLMs (Google Gemini) to categorize, score, and draft responses.

## 🚀 Key Features

- **Asynchronous Processing**: Immediate HTTP response (201 Created) while heavy AI tasks run in the background.
- **AI Triage Engine**: Utilizes Google Gemini 1.5 Flash to automatically:
  - **Categorize**: Billing, Technical, or Feature Request.
  - **Score Sentiment**: 1-10 scale.
  - **Assess Urgency**: High, Medium, or Low.
  - **Draft Response**: Polite, context-aware AI-generated drafts.
- **Robust Infrastructure**: Built with Bun, Express, Prisma (PostgreSQL), and RabbitMQ for reliable job queuing.
- **Comprehensive API**: Full CRUD for Tickets and Categories, protected by JWT authentication.

---

## 🛠️ Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Framework**: Express.js
- **Database**: PostgreSQL (Prisma ORM)
- **Queue**: RabbitMQ (amqplib)
- **AI**: Google Gemini AI
- **Testing**: Jest & Supertest

---

## ⚙️ Setup Instructions

### 1. Prerequisites

- [Bun](https://bun.sh) installed.
- [PostgreSQL](https://www.postgresql.org/) instance running.
- [RabbitMQ](https://www.rabbitmq.com/) instance running (e.g., via Docker: `docker run -d --name rabbit -p 5672:5672 rabbitmq`).
- [Google Gemini API Key](https://aistudio.google.com/).

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/mc_theer?schema=public"
JWT_SECRET=your_jwt_secret
RABBITMQ_URL=amqp://localhost
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:1000
```

### 3. Install Dependencies

```bash
bun install
```

### 4. Database Initialization

```bash
# Push schema to DB
bunx prisma db push

# Seed the database (Default Admin & Categories)
bun prisma/seed.ts
```

---

## 🐳 Running with Docker (Recommended)

The easiest way to get the entire stack (API, Worker, DB, RabbitMQ) running is using Docker:

1.  **Configure Environment**:
    ```bash
    cp .env.example .env
    ```
2.  **Start Services**:
    ```bash
    docker compose up -d --build
    ```
3.  **Check Status**:
    - **API**: [http://localhost:3000](http://localhost:3000)
    - **RabbitMQ Management**: [http://localhost:15672](http://localhost:15672) (guest/guest)
    - **Logs**: `docker compose logs -f`

---

## 🏃 Running the App (Manual)

The system consists of two main components that should run simultaneously:

### 1. Start the Express API

```bash
bun run dev
```

### 2. Start the AI Worker

```bash
bun run worker:ticket
```

### 3. Running Tests

```bash
bun run test
```

---

## 🔗 API Documentation

### Auth

- `POST /api/auth/register`: Register a new agent.
- `POST /api/auth/login`: Login to receive a JWT token.

### Tickets (Protected)

- `POST /api/tickets`: **Ingestion Endpoint**. Accepts `title` and `content`. returns `201` instantly.
- `GET /api/tickets`: List all tickets with AI results and creator info.
- `GET /api/tickets/:uuid`: View details of a specific ticket.
- `PUT /api/tickets/:uuid/resolve`: Mark a ticket as resolved and optionally refine the AI draft.

---

## 🏗️ Architectural Decisions

### Handling the "Bottle-Neck"

To prevent the 3-5 second LLM latency from blocking our API, we implemented a **Producer-Consumer pattern** using RabbitMQ.

1. The API (Producer) saves the ticket and enqueues a `ticketId` job.
2. The Worker (Consumer) picks up the job, calls Gemini AI, and updates the database once the triage is complete.

### Data Integrity & Safety

- **UUIDs**: Exposed via API to prevent ID enumeration.
- **Validation**: Strict input validation using `express-validator` to ensure AI receives clean data.
- **Idempotency**: The database seeding and worker updates are designed to be idempotent.

---

## 🤖 Video Walkthrough Outline (Cheat Sheet)

If you are recording a Loom video, consider this structure:

1. **Introduction**: Briefly show the code structure and explain the goal (Triage Hub).
2. **The "Bottleneck" Test**: Show a POST request to `/tickets`. Point out that the response is instant (21ms) while the AI worker starts logging in the background.
3. **The AI Worker**: Switch to the worker terminal. Explain how it calls Gemini 1.5 Flash and updates the ticket with Category, Sentiment (1-10), and Urgency (High/Medium/Low).
4. **Agent Workflow**: Show the `GET /api/tickets` response showing the AI results. Demonstrate calling the `/resolve` endpoint to close a ticket.
5. **AI Tooling**: Mention how using **Antigravity (AI Assistant)** helped you rapidly scaffold the RabbitMQ logic and handle complex Prisma relation updates without manual boilerplate.

---

## 🔧 Troubleshooting & FAQ

### 1. 500 Internal Server Error on `/api/user/me`

If you receive a 500 error when hitting the `me` endpoint, check the following:

- **Database Status**: Ensure the database is running and migrated (`bunx prisma db push`).
- **JWT Token**: Ensure you are sending a valid `Bearer` token in the Authorization header.
- **CORS Mismatch**: Check if your `FRONTEND_URL` in `.env` matches the origin of your request.
- **Logs**: Run `docker compose logs -f api` to see the detailed error stack trace.

### 2. CORS Issues

The backend uses dynamic CORS based on the `FRONTEND_URL` environment variable.

- Default: `http://localhost:1000`
- To allow multiple origins, update `src/infra/config.ts`.
- Make sure to restart the server after changing `.env`.

### 3. Docker Networking

If your frontend is in a separate `docker-compose.yml`, ensure they share the same network:

```yaml
# In both docker-compose files
networks:
  mctheer-network:
    external: true
```

And use the container name as the host: `http://mctheer-api:3000`.
