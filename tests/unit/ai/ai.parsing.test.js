/**
 * Unit tests for AI JSON parsing and citation enforcement logic.
 * These tests mock the AI factory and exercise only the service-layer logic.
 */

jest.mock('../../../src/integrations/ai/ai.factory');
jest.mock('../../../src/models/Transcript.model');
jest.mock('../../../src/models/Insight.model');
jest.mock('../../../src/models/ActionItem.model');
jest.mock('../../../src/models/Meeting.model');

const aiFactory = require('../../../src/integrations/ai/ai.factory');
const Transcript = require('../../../src/models/Transcript.model');
const Insight = require('../../../src/models/Insight.model');
const ActionItem = require('../../../src/models/ActionItem.model');
const Meeting = require('../../../src/models/Meeting.model');

const aiService = require('../../../src/api/v1/ai/ai.service');

const MEETING_ID = '507f1f77bcf86cd799439011';
const USER_ID = '507f1f77bcf86cd799439012';

const mockTranscript = {
  _id: '507f1f77bcf86cd799439013',
  meeting: MEETING_ID,
  owner: USER_ID,
  rawText: 'Alex: Let us finalize the Q3 roadmap. Jordan: I will handle the onboarding redesign by Friday.',
};

beforeEach(() => {
  jest.clearAllMocks();
  Transcript.findOne = jest.fn().mockResolvedValue(mockTranscript);
  Meeting.findByIdAndUpdate = jest.fn().mockResolvedValue({});
});

describe('AI Service – safe JSON parsing', () => {
  it('throws ApiError.unprocessable when Gemini returns malformed JSON', async () => {
    aiFactory.complete = jest.fn().mockResolvedValue('this is not json {{{');

    await expect(aiService.summarize(MEETING_ID, USER_ID)).rejects.toMatchObject({
      statusCode: 422,
    });
  });

  it('throws ApiError.unprocessable when summary is null', async () => {
    aiFactory.complete = jest.fn().mockResolvedValue(JSON.stringify({ summary: null, citations: [] }));

    await expect(aiService.summarize(MEETING_ID, USER_ID)).rejects.toMatchObject({
      statusCode: 422,
    });
  });

  it('throws when summary has no citations', async () => {
    aiFactory.complete = jest.fn().mockResolvedValue(
      JSON.stringify({ summary: 'A fine meeting.', citations: [] })
    );

    await expect(aiService.summarize(MEETING_ID, USER_ID)).rejects.toMatchObject({
      statusCode: 422,
    });
  });

  it('saves insight when summary has valid citations', async () => {
    const fakeInsight = { _id: 'ins1', type: 'summary' };
    Insight.create = jest.fn().mockResolvedValue(fakeInsight);

    aiFactory.complete = jest.fn().mockResolvedValue(
      JSON.stringify({
        summary: 'Team agreed to finalise roadmap.',
        citations: [{ quote: 'Let us finalize the Q3 roadmap', speaker: 'Alex' }],
      })
    );

    const result = await aiService.summarize(MEETING_ID, USER_ID);
    expect(result).toEqual(fakeInsight);
    expect(Insight.create).toHaveBeenCalledTimes(1);
  });
});

describe('AI Service – citation enforcement for action items', () => {
  it('discards action items without sourceQuote', async () => {
    ActionItem.insertMany = jest.fn().mockResolvedValue([]);

    aiFactory.complete = jest.fn().mockResolvedValue(
      JSON.stringify({
        actionItems: [
          { title: 'Deploy to production', assignee: { name: 'Sam' }, sourceQuote: '' },
          { title: 'Write tests', assignee: { name: 'Jordan' } },
        ],
      })
    );

    const result = await aiService.extractActionItems(MEETING_ID, USER_ID);
    expect(result).toEqual([]);
    expect(ActionItem.insertMany).not.toHaveBeenCalled();
  });

  it('saves only cited action items', async () => {
    const saved = [{ _id: 'ai1', title: 'Redesign onboarding' }];
    ActionItem.insertMany = jest.fn().mockResolvedValue(saved);

    aiFactory.complete = jest.fn().mockResolvedValue(
      JSON.stringify({
        actionItems: [
          {
            title: 'Redesign onboarding',
            assignee: { name: 'Jordan' },
            priority: 'high',
            sourceQuote: 'I will handle the onboarding redesign by Friday',
          },
          { title: 'Ghost item' },
        ],
      })
    );

    const result = await aiService.extractActionItems(MEETING_ID, USER_ID);
    expect(ActionItem.insertMany).toHaveBeenCalledTimes(1);
    const insertedItems = ActionItem.insertMany.mock.calls[0][0];
    expect(insertedItems).toHaveLength(1);
    expect(insertedItems[0].title).toBe('Redesign onboarding');
  });
});

describe('AI Service – analyzeAll partial failure', () => {
  it('returns partial results when one task fails', async () => {
    Insight.create = jest.fn().mockResolvedValue({ type: 'summary', content: 'ok', citations: [{ quote: 'x' }] });
    ActionItem.insertMany = jest.fn().mockRejectedValue(new Error('DB error'));
    Insight.insertMany = jest.fn().mockResolvedValue([]);

    aiFactory.complete = jest
      .fn()
      // summarize call
      .mockResolvedValueOnce(
        JSON.stringify({ summary: 'ok', citations: [{ quote: 'Let us finalize' }] })
      )
      // extractActionItems call – will parse but insertMany throws
      .mockResolvedValueOnce(
        JSON.stringify({
          actionItems: [{ title: 'Task', sourceQuote: 'I will handle' }],
        })
      )
      // generateInsights call
      .mockResolvedValueOnce(JSON.stringify({ insights: [] }));

    const result = await aiService.analyzeAll(MEETING_ID, USER_ID);
    expect(result.summary).toBeTruthy();
    expect(result.errors).toBeDefined();
    expect(result.errors[0].task).toBe('actionItems');
  });
});
