# Architecture & Design Decisions

## Repository Pattern

Each feature module has a dedicated `repository.js` that owns all Mongoose queries. Services contain business logic only; controllers contain only request/response wiring. This separation means swapping MongoDB for another database requires changes only in repository files.

## asyncHandler + ApiError

All controllers are wrapped in `asyncHandler` to eliminate boilerplate try/catch. Errors thrown anywhere in the call stack bubble to the global error middleware, which normalises Mongoose, JWT, and custom `ApiError` instances into consistent JSON shapes.

## JWT Dual-Token Strategy

Access tokens expire in 7 days; refresh tokens in 30 days. The short-lived access token limits exposure if a token is leaked. Refresh tokens are validated against the stored secret and return a new pair on each call.

## AI Provider Factory

`ai.factory.js` routes to OpenAI or Gemini based on `AI_PROVIDER` env var. Both clients honour a `{ json: true }` option that sets the provider-specific JSON mode (`response_format` for OpenAI, `responseMimeType` for Gemini), eliminating format-specific code from the service layer.

## Anti-Hallucination Prompts

Every AI prompt explicitly instructs the model to ONLY use transcript content, NEVER invent information, and return `null`/empty arrays when uncertain. The service layer enforces this post-hoc: summaries without citations and action items without `sourceQuote` are discarded before being written to MongoDB.

## Promise.allSettled in analyzeAll

Using `Promise.allSettled` instead of `Promise.all` means a failure in one AI task (e.g. Gemini timeout) does not cancel the other tasks. The caller receives partial results plus an `errors` array describing what failed. This is critical for a compound analysis that calls the AI API three times.

## /overdue Before /:id in Action Items Router

Express matches routes in registration order. Registering `GET /overdue` before `GET /:id` prevents Express from treating the literal string "overdue" as an ObjectId parameter, which would produce a Mongoose CastError.

## Text Index on Meeting

The full-text search index on `{ title, description, tags }` enables `$text: { $search: ... }` queries without a full collection scan. The `meeting.repository.js` already used `$text` search; this index makes it functional.

## xss-clean Middleware

Applied globally before route handlers to strip `<script>` tags and HTML entities from all string inputs. Combined with `express-mongo-sanitize` (NoSQL injection prevention) and Helmet (HTTP security headers), this covers the OWASP top-3 for APIs.

## Overdue Job Frequency

Changed from hourly to every 15 minutes to match the same schedule as the meeting reminder job. The acceptable SLA for an overdue alert is minutes, not hours.

## traceId in Every Response

The `traceId` middleware generates a UUID per request and sets it as the `X-Trace-Id` response header. `ApiResponse.send()` reads this header and injects it into the JSON body. Error responses include it directly in the handler. This makes every log line and every client error correlatable.
