const { GoogleGenerativeAI } = require('@google/generative-ai');
const { aiConfig } = require('../../config/ai.config');
const logger = require('../../utils/logger');

let genAI = null;
const getClient = () => {
  if (!genAI) genAI = new GoogleGenerativeAI(aiConfig.gemini.apiKey);
  return genAI;
};

const complete = async (systemPrompt, userContent, options = {}) => {
  const model = getClient().getGenerativeModel({
    model: options.model || aiConfig.gemini.model,
    systemInstruction: systemPrompt,
    generationConfig: {
      maxOutputTokens: options.maxTokens || aiConfig.gemini.maxTokens,
      temperature: options.temperature ?? aiConfig.gemini.temperature,
      responseMimeType: options.json ? 'application/json' : 'text/plain',
    },
  });

  const result = await model.generateContent(userContent);
  const text = result.response.text();

  logger.debug('Gemini completion', {
    model: aiConfig.gemini.model,
    candidateCount: result.response.candidates?.length,
  });

  return text;
};

module.exports = { complete };
