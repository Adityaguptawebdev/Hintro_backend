# Changelog

## [1.1.0] — 2026-06-03

### Added
- **Transcript module** — `POST /api/v1/transcripts/:meetingId` and `GET /api/v1/transcripts/:meetingId` with Joi validation, ownership enforcement, and `Meeting.hasTranscript` flag
- **Action Items module** — full CRUD: `GET /`, `POST /`, `PATCH /:id/status`, `GET /overdue` with filters by status / meetingId / assignee / priority
- **Notifications module** — `GET /api/v1/notifications` (paginated, unreadOnly filter) and `PATCH /api/v1/notifications/:id/read`
- **Evaluation endpoint** — `GET /api/v1/evaluation` returns platform health, AI provider, database state, and aggregate counts for all entities
- **`POST /api/v1/meetings/:id/analyze`** — shortcut analyze route alongside the existing `/api/v1/ai/meetings/:id/analyze`
- **Telegram overdue alerts** — `overdue.job.js` now calls `telegramClient.sendMessage` for users with `notifyViaTelegram: true` and a connected chat ID
- **Meeting full-text search index** — `{ title: "text", description: "text", tags: "text" }` on the Meeting model
- **`xss-clean` middleware** — applied globally to sanitise HTML/script injection in request bodies
- **Integration tests** — auth, meetings, transcripts, action items
- **Unit tests** — AI JSON parsing, citation enforcement, partial failure, overdue detection job
- **Documentation** — README.md, DECISIONS.md, AI_APPROACH.md, TESTING.md, CHANGELOG.md, CHECKLIST.md

### Changed
- **Anti-hallucination prompts** — all three AI prompts (summarize, extractActions, generateInsights) now include explicit constraints against fabrication and require citations
- **Safe JSON parsing** — all `JSON.parse` calls wrapped in `safeParseJson()` with logging and 422 response on failure
- **Citation enforcement** — summaries without citations and action items without `sourceQuote` are discarded before database write
- **`analyzeAll`** — migrated from `Promise.all` to `Promise.allSettled`; partial failures return successful results + `errors` array
- **`overdue.job.js`** — runs every 15 minutes (was hourly)
- **`ApiResponse.send()`** — injects `X-Trace-Id` response header value into JSON body as `traceId`
- **Health endpoint** — returns `{ status: "UP" }` (was `{ status: "ok" }`)
- **`notFoundHandler`** — includes `traceId` in 404 responses
- **Password validator** — register and change-password now require at least one uppercase letter, one lowercase letter, and one number
- **`package.json`** — fixed jest config key from `setupFilesAfterFramework` (invalid) to `setupFilesAfterEnv`

### Fixed
- Route shadowing in action items router: `GET /overdue` registered before `GET /:id`
- `express-validator` and `xss-clean` were installed but unused; `xss-clean` is now applied
