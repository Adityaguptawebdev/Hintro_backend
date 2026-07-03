# AI Approach

## Provider Strategy

The platform uses an AI factory pattern to support both Google Gemini and OpenAI interchangeably. The active provider is controlled by the `AI_PROVIDER` environment variable (`gemini` or `openai`). Both providers are configured with `temperature: 0.3` and `maxTokens: 4096` for consistent, deterministic output.

## Anti-Hallucination Design

All three prompts (summarize, extractActions, generateInsights) include explicit constraints:

1. **Source restriction**: "ONLY use information explicitly stated in the provided transcript"
2. **Fabrication prohibition**: "NEVER invent, infer, or hallucinate names, decisions, action items, or attendees"
3. **Null fallback**: "If a field cannot be determined from the transcript, return null"
4. **Ambiguity handling**: "If the transcript is too ambiguous, return `{summary: null}`"

These constraints are in the system prompt, not the user prompt, so they cannot be overridden by transcript content.

## Citation Enforcement

Every insight, summary, and action item must include grounded evidence:

- **Summaries**: Must have a non-empty `citations` array. Each citation is `{ quote, speaker }` where `quote` is verbatim text from the transcript. Summaries with empty citations are rejected and not stored.
- **Insights**: Same citation requirement. The AI prompt instructs the model to discard insights it cannot support with a direct quote.
- **Action Items**: Must have a non-empty `sourceQuote` field containing the verbatim sentence that generated the task. Items without `sourceQuote` are filtered out before `insertMany`.

This is enforced at two levels: the prompt (instructing the model) and the `filterUncited()` function (discarding uncompliant outputs before database write).

## Safe JSON Parsing

All `JSON.parse()` calls are wrapped in `safeParseJson()`:

```javascript
const safeParseJson = (content, context) => {
  try {
    return JSON.parse(content);
  } catch (err) {
    logger.warn(`[AI] Malformed JSON from ${context}`, { snippet: content?.substring(0, 300) });
    throw ApiError.unprocessable(`AI returned malformed JSON for ${context}`);
  }
};
```

If the model returns prose, markdown code fences, or truncated JSON, the error is caught, logged with a content snippet for debugging, and returned as a 422 to the caller. The server never crashes.

## Partial Failure Support

`analyzeAll()` uses `Promise.allSettled` so a timeout or parse error in one task (e.g. summarize) does not cancel the other two. The response shape is:

```json
{
  "summary": { ... } | null,
  "actionItems": [ ... ],
  "insights": [ ... ],
  "errors": [
    { "task": "summary", "error": "AI returned malformed JSON" }
  ]
}
```

The `errors` field is only present when at least one task fails.

## JSON Mode

Both providers are called with JSON mode enabled:
- **Gemini**: `responseMimeType: 'application/json'`
- **OpenAI**: `response_format: { type: 'json_object' }`

This constrains the model's output token space to valid JSON, reducing (but not eliminating) parse errors.

## Prompts

### Summarize
Returns `{ summary, keyPoints, citations }`. Summary is null if the transcript is too ambiguous.

### Extract Actions
Returns `{ actionItems: [{ title, assignee, dueDate, priority, sourceQuote }] }`. Returns empty array if no clear action items are found.

### Generate Insights
Returns `{ insights: [{ type, title, content, citations }] }`. Types: `key_decision`, `risk`, `opportunity`, `followup`. Returns empty array if no grounded insights are possible.
