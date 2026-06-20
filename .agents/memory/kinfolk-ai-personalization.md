---
name: KinfolkAI Personalization Architecture
description: Multi-turn chat, learning preferences, feedback loop, and chat UI for KinfolkAI™ in travel.tsx
---

## DB Tables (3 new)
- `user_preferences` — userId PK, favoriteCategories/avoidCategories/favoriteCities (jsonb arrays), budgetRange, tripStyle (jsonb), travelCompanion, dietaryNotes
- `kinfolk_sessions` — id (uuid), userId, title, destination, vibes (jsonb), messages (jsonb SessionMessage[]), createdAt/updatedAt
- `kinfolk_feedback` — id (uuid), userId, sessionId, businessName, category, city, reaction ('like'|'dislike'), createdAt

## API Routes (/api/kinfolk/*)
- `GET/PUT /api/kinfolk/preferences` — auth required; upsert on conflict
- `POST /api/kinfolk/chat` — works for guests too (no auth = no personalization); fetches prefs + feedback history + saved places to build system prompt; keeps last 12 messages as context; saves/updates session; detects destination from AI response
- `GET /api/kinfolk/sessions` — auth required; returns last 30 sessions (no messages, just metadata)
- `GET /api/kinfolk/sessions/:id` — auth required; returns full session with messages
- `POST /api/kinfolk/feedback` — auth required; thumbs up/down on a spot

## AI Response Format
AI must return JSON: `{ reply: string, recommendations: {...} | null, followUpSuggestions: string[] }`
- `reply` shown as chat bubble
- `recommendations` same structure as legacy /api/travel/recommendations
- `followUpSuggestions` rendered as quick-reply chips below AI message

## Mobile Hooks
- `useKinfolk.ts` — sendMessage, submitFeedback, loadSessions, loadSession, startNewSession; feedback updates message.feedback optimistically
- `useUserPreferences.ts` — load() on mount, update() does PUT; returns null when unauthenticated

## Mobile UI (travel.tsx)
- Full chat-based rewrite; FlatList of ChatMessage items
- WelcomeScreen when no messages (suggested cities + prompt chips)
- AiMessageBubble: text bubble + expandable sections (Spots/Areas/Events/Safety) + quick-reply chips
- BusinessCard: thumbs up/down per spot, updates AI message feedback state
- TypingIndicator: 3-dot bounce animation while loading
- TasteProfileSheet: Modal with category chips, avoid categories, budget, trip style, companion — saves to API
- SessionHistoryDrawer: Modal showing past conversations, "New Chat" button
- Header: Profile button (opens TasteProfileSheet), History button, New Chat button
- Personalization banner shown on welcome when profile has data
- Neighbor Voice toggle: collapsible panel above input row

**Why:** savedPlacesTable only has `businessId` (no businessName column) — use businessId directly in saved places list passed to AI.
