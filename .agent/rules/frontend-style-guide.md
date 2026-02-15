**Language & Framework:** React (Next.js) with Tailwind CSS

**Formatting**
- Indent: 2 spaces
- Semicolons: true
- Quotes: single ('')

**Design Philosophy (Premium UI)**
- **Colors**: Use a refined palette (e.g., Slate/Zinc for neutrals, Emerald/Rose/Amber for status). Avoid default bright colors.
- **Typography**: Use clean sans-serif fonts (Inter or Geist).
- **Cards & Shadows**: Use subtle border-radius (rounded-xl) and soft shadows (shadow-sm).
- **Interactive**: 
  - Buttons must have hover and active states.
  - Form validation must be immediate and clear.
  - Loading states (Skeletons) for async data fetching.

**Component Structure**
```
src/
  app/ # Next.js App Router pages
  components/
    ui/ # Shadcn UI (atomic)
    dashboard/ # Complex feature-specific components
    forms/ # Reusable form fields
  hooks/ # Custom React hooks (useAuth, useTickets)
  services/ # API calls
  types/ # TS Interfaces
  utils/ # Helper formatting (date-fns, currency)
```

**State Management**
- Use `React Query` (TanStack Query) for server state (caching/fetching).
- Use `Zustand` for simple global UI state if needed.
