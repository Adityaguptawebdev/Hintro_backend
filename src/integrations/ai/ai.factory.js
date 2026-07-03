const { aiConfig } = require('../../config/ai.config');
const openaiClient = require('./openai.client');
const geminiClient = require('./gemini.client');

const providers = { openai: openaiClient, gemini: geminiClient };

const getProvider = (override) => {
  const name = override || aiConfig.provider;
  const provider = providers[name];
  if (!provider) throw new Error(`Unknown AI provider: ${name}`);
  return { name, provider };
};

const complete = (systemPrompt, userContent, options = {}) => {
  const { provider } = getProvider(options.provider);
  return provider.complete(systemPrompt, userContent, options);
};

module.exports = { complete, getProvider };
