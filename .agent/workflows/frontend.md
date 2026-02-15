---
description: Steps to build the Agent Dashboard and User Ticket Portal
---

### Phase 1 — Setup
1. Initialize a new Next.js project in a `frontend` directory using `npx create-next-app@latest`.
   - Use TypeScript, ESLint, Tailwind CSS, and App Router.
2. Install UI components: `npx shadcn-ui@latest init` and common components (Button, Card, Table, Badge, Dialog).
3. Setup an API client (Axios or native fetch wrapper) with a base URL pointing to the backend.
4. Implement basic Auth (Login/Register) flows and store JWT in `localStorage` or `cookies`.

### Phase 2 — User Ticket Portal
1. **List View**: Create a page to list the user's tickets with status badges.
2. **Creation Form**: Create a form to submit a new ticket (Title, Content, Category).
3. **Detail View**: View ticket details and the AI processed status.

### Phase 3 — Agent Dashboard (Core)
1. **Prioritized List**: Create a table for admins showing ALL tickets.
   - **Color Coding**: High (Red), Medium (Yellow), Low (Green).
   - **Sort/Filter**: Sort by Urgency and Sentiment Score.
2. **Detail/Resolve Page**:
   - Show User Complaint vs AI Draft side-by-side.
   - Professional "Edit & Resolve" interface.
   - Real-time status indicator (to see when AI triage is complete).

### Phase 4 — Polish & UX
1. Add smooth transitions and hover effects.
2. Implement "Optimistic Updates" for resolving tickets.
3. Ensure responsiveness for mobile and desktop.
4. Add a "Triage Summary" stats card (Total tickets, Average sentiment, Critical tickets count).