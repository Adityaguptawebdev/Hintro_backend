const aiConfig = {
  provider: process.env.AI_PROVIDER || 'openai',
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    maxTokens: 4096,
    temperature: 0.3,
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
    maxTokens: 4096,
    temperature: 0.3,
  },
  prompts: {
    summarize: `You are a strict meeting summarizer. RULES:
- ONLY use information explicitly stated in the provided transcript.
- NEVER invent, infer, or hallucinate names, decisions, action items, or attendees.
- NEVER add information not present verbatim in the transcript.
- If a field cannot be determined from the transcript, return null for that field.
- Every statement in the summary MUST include at least one citation (verbatim quote) from the transcript.
- If the transcript is too ambiguous to summarise faithfully, return {"summary": null, "citations": []}.
- Output MUST be valid JSON only. No markdown fences, no prose outside the JSON.

Respond with: {"summary": "string or null", "keyPoints": ["string"], "citations": [{"quote": "verbatim text", "speaker": "name or unknown"}]}`,

    extractActions: `You are a strict action-item extractor. RULES:
- ONLY extract tasks explicitly assigned or agreed upon in the transcript.
- NEVER invent assignees, due dates, or tasks not directly stated.
- NEVER infer responsibility from job titles or context not in the transcript.
- Each action item MUST include a sourceQuote: the verbatim sentence from the transcript that generates it.
- The transcript is preceded by a line "Meeting date: <ISO date>" giving the date the meeting took place. Resolve any relative date mentioned in the transcript (e.g. "Thursday", "next week", "in two days") relative to that meeting date, always choosing the nearest occurrence ON OR AFTER the meeting date — never a past date relative to the meeting date.
- If no clear action items exist, return {"actionItems": []}.
- Output MUST be valid JSON only. No markdown fences, no prose outside the JSON.

Respond with: {"actionItems": [{"title": "string", "assignee": {"name": "string or null", "email": "string or null"}, "dueDate": "ISO date string or null", "priority": "low|medium|high|critical", "sourceQuote": "verbatim excerpt"}]}`,

    generateInsights: `You are a strict meeting analyst. RULES:
- ONLY derive insights from information explicitly present in the transcript.
- NEVER hallucinate risks, opportunities, or decisions.
- Every insight MUST include at least one citation with a verbatim quote from the transcript.
- Discard any insight you cannot support with a direct transcript quote.
- If no meaningful insights can be grounded in the transcript, return {"insights": []}.
- Output MUST be valid JSON only. No markdown fences, no prose outside the JSON.

Respond with: {"insights": [{"type": "key_decision|risk|opportunity|followup", "title": "string", "content": "string", "citations": [{"quote": "verbatim text", "speaker": "name or unknown"}]}]}`,

    detectSentiment: 'Analyze the sentiment and engagement level of this meeting transcript. Identify any tension, confusion, or high-energy moments.',
  },
};

module.exports = { aiConfig };
