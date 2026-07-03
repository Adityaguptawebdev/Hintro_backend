# Testing Guide

## Stack

- **Jest** — test runner
- **Supertest** — HTTP assertions against Express app
- **mongodb-memory-server** — in-memory MongoDB (no real DB needed)

## Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Coverage report
npm run test:coverage
```

## Test Structure

```
tests/
├── fixtures/
│   └── setup.js              # MongoMemoryServer lifecycle (beforeAll/afterAll/afterEach)
├── unit/
│   ├── auth/
│   │   └── auth.service.test.js       # Register/login service logic
│   ├── ai/
│   │   └── ai.parsing.test.js         # JSON parsing, citation enforcement, partial failure
│   └── jobs/
│       └── overdue.detection.test.js  # Overdue flag, Telegram dispatch, error resilience
└── integration/
    ├── auth.test.js           # Register/login HTTP flows, password complexity
    ├── meetings.test.js       # Full meetings CRUD over HTTP
    ├── transcripts.test.js    # Upload/retrieve transcript HTTP flows
    └── actionItems.test.js    # Action item CRUD + status update + overdue endpoint
```

## Key Test Scenarios

### Auth
- Register with valid credentials → 201 + tokens
- Duplicate email → 409
- Weak password (missing uppercase) → 400
- Login with wrong password → 401

### AI Parsing
- Malformed JSON from AI → 422 (no crash)
- Null summary → 422
- Summary without citations → 422
- Valid cited summary → Insight saved
- Action items without sourceQuote → discarded (not saved)
- `analyzeAll` partial failure → returns successful tasks + `errors` array

### Overdue Detection
- Newly overdue item → `isOverdue: true`, in-app notification created
- User with Telegram enabled → `sendMessage` called
- User with Telegram disabled → `sendMessage` not called
- One item fails → remaining items still processed

### Transcripts
- Upload with segments → `wordCount` auto-calculated, `hasTranscript` set on meeting
- GET before upload → 404
- Upload to non-existent meeting → 404

### Action Items
- Create → 201, filtered by meetingId/status
- Status update to `completed` → `completedAt` set
- `GET /overdue` registered before `GET /:id` → no route shadowing

## Coverage Goals

| Area | Target |
|------|--------|
| AI service | 90% |
| Action items module | 85% |
| Auth module | 90% |
| Transcript module | 85% |
| Jobs | 80% |
