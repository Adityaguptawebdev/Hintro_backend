const OpenAI = require('openai');
const { aiConfig } = require('../../config/ai.config');
const logger = require('../../utils/logger');

let client = null;
const getClient = () => {
  if (!client) client = new OpenAI({ apiKey: aiConfig.openai.apiKey });
  return client;
};

const complete = async (systemPrompt, userContent, options = {}) => {
  const response = await getClient().chat.completions.create({
    model: options.model || aiConfig.openai.model,
    max_tokens: options.maxTokens || aiConfig.openai.maxTokens,
    temperature: options.temperature ?? aiConfig.openai.temperature,
    response_format: options.json ? { type: 'json_object' } : undefined,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
  });

  logger.debug('OpenAI completion', {
    model: response.model,
    promptTokens: response.usage?.prompt_tokens,
    completionTokens: response.usage?.completion_tokens,
  });

  return response.choices[0].message.content;
};

module.exports = { complete };
