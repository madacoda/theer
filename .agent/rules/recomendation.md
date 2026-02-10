---
trigger: always_on
---

- **Async processing:** Never call AI in API request-response; always enqueue jobs
- **JSON schema:** AI output must follow strict JSON schema for category, sentimentScore, urgency, draft
- **Type safety:** Use TypeScript types for DB models, API payloads, AI responses
- **Logging:** Log all AI calls, RabbitMQ jobs, and errors
- **Retries:** Worker retries must be idempotent; dead-letter queue optional
- **Testing:** Mock AI for deterministic feature tests
- **CI/CD ready:** Lint, format, test on commit
- **Security:** Validate API inputs, escape DB queries via Prisma
- **Iterative development:** Build minimal async flow first, integrate AI after API works
