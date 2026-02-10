---
description:
---

### Phase 0 — Prep

1. Install Bun
2. Initialize Bun project with TypeScript
3. Install dependencies:
   - express, cors, dotenv
   - prisma, @prisma/client
   - amqplib (RabbitMQ)
   - jest, ts-jest, supertest
4. Setup PostgreSQL (Docker container)
5. Setup RabbitMQ (Docker container)
6. Create `.env` for DB & RabbitMQ config
7. Generate Prisma schema for `Ticket`
8. Run Prisma migration

### Phase 1 — API Core

1. Create Express server
2. Build `POST /tickets` endpoint
3. Save ticket to PostgreSQL
4. Enqueue RabbitMQ job immediately
5. Return `201 Created` instantly
6. Write feature test: API returns 201, ticket status = PROCESSING

### Phase 2 — Worker

1. Build RabbitMQ consumer
2. Fetch ticket from DB
3. Call AI helper (mock first)
4. Parse JSON schema
5. Update ticket with AI fields
6. Mark status = OPEN
7. Write feature test: ticket status updates after job

### Phase 3 — AI Integration

1. Implement LLM call helper
2. Define AI JSON schema:
   - category: Billing | Technical | Feature Request
   - sentimentScore: 1–10
   - urgency: High | Medium | Low
   - draft: string
3. Integrate real AI call in worker
4. Logging of AI request/response

### Phase 4 — Testing

1. Jest / Supertest API tests
2. Worker integration tests (mock AI)
3. Retry & idempotency test
4. Feature test: submit ticket → processed by worker → DB updated

### Phase 5 — Docker

1. Create Dockerfile for Bun backend
2. Docker-compose: backend + postgres + rabbitmq
3. Ensure environment variables passed correctly
4. Test API inside Docker
