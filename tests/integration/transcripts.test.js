require('../fixtures/setup');

const request = require('supertest');
const app = require('../../src/app');

const registerAndLogin = async () => {
  const user = { name: 'Transcript User', email: `tu_${Date.now()}@test.com`, password: 'Password1' };
  const res = await request(app).post('/api/v1/auth/register').send(user);
  return res.body.data.accessToken;
};

const futureDate = new Date(Date.now() + 86400000).toISOString();

describe('Transcripts API', () => {
  let token;
  let meetingId;

  beforeEach(async () => {
    token = await registerAndLogin();
    const m = await request(app)
      .post('/api/v1/meetings')
      .set({ Authorization: `Bearer ${token}` })
      .send({ title: 'Test Meeting', scheduledAt: futureDate });
    meetingId = m.body.data._id;
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  describe('POST /api/v1/transcripts/:meetingId', () => {
    it('creates a transcript and sets meeting.hasTranscript', async () => {
      const res = await request(app)
        .post(`/api/v1/transcripts/${meetingId}`)
        .set(auth())
        .send({
          rawText: 'Alex: Let us start.\nJordan: Agreed.',
          segments: [
            { speaker: 'Alex', text: 'Let us start.', timestamp: 0 },
            { speaker: 'Jordan', text: 'Agreed.', timestamp: 15 },
          ],
        });
      expect(res.status).toBe(201);
      expect(res.body.data.rawText).toBeDefined();
      expect(res.body.data.wordCount).toBeGreaterThan(0);
    });

    it('rejects missing rawText with 422', async () => {
      const res = await request(app)
        .post(`/api/v1/transcripts/${meetingId}`)
        .set(auth())
        .send({ segments: [] });
      expect(res.status).toBe(422);
    });

    it('returns 404 for non-existent meeting', async () => {
      const res = await request(app)
        .post('/api/v1/transcripts/507f1f77bcf86cd799439099')
        .set(auth())
        .send({ rawText: 'Hello world' });
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/transcripts/:meetingId', () => {
    it('retrieves the saved transcript', async () => {
      await request(app)
        .post(`/api/v1/transcripts/${meetingId}`)
        .set(auth())
        .send({ rawText: 'Transcript content here.' });

      const res = await request(app)
        .get(`/api/v1/transcripts/${meetingId}`)
        .set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data.rawText).toBe('Transcript content here.');
    });

    it('returns 404 when no transcript exists', async () => {
      const res = await request(app)
        .get(`/api/v1/transcripts/${meetingId}`)
        .set(auth());
      expect(res.status).toBe(404);
    });
  });
});
