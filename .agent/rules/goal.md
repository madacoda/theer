---
trigger: always_on
---

The AI Support "Triage & Recovery" Hub
Goal: Build a system that ingests user complaints and asynchronously turns them into
prioritized, "ready-to-send" drafts.

1. The Ingestion API (The "Bottle-Neck" Test)
   ● Create a POST /tickets endpoint.
   ● Constraint: The AI processing (which takes 3-5 seconds) must not block the HTTP
   response. The API must return a 201 Created status immediately to the user, while
   the AI processing happens in the background.
2. The AI Triage Engine (Background Worker)
   ● Implement a background task that calls an LLM to:
   ○ Categorize: (Billing, Technical, Feature Request).
   ○ Score: Sentiment (1-10) and Urgency (High/Medium/Low).
   ○ Draft: A polite, context-aware response.
   ● Constraint: Ensure the AI returns valid JSON so your database stores the Category
   and Score as distinct fields, not just text.
3. The Agent Dashboard
   ● List View: Show tickets color-coded by Urgency (Red/Green).
   ● Detail View: Allow an agent to edit the AI draft and click "Resolve" (updating the
   database).

This project will be delivered as code tests for employemeent