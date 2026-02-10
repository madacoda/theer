---
trigger: always_on
---

**Language & Runtime:** TypeScript with Bun

**Formatting**

- Indent: 2 spaces
- Semicolons: always
- Quotes: single ('')
- Max line length: 100

**Naming Conventions**

- Variables & functions: camelCase
- Classes: PascalCase
- Files & folders: kebab-case

**Folder Structure**

```
src/
api/ # Express routes / controllers
workers/ # RabbitMQ consumers + AI jobs
infra/ # DB connection, RabbitMQ connection, config
prisma/ # Prisma schema
utils/ # helper functions (AI calls, validation, logging)
tests/ # Jest / Supertest
```

**Testing**

- Framework: Jest
- API tests: Supertest
- Feature tests: true
- Mock AI: true
