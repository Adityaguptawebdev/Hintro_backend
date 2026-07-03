require('../fixtures/setup');

const request = require('supertest');
const app = require('../../src/app');

const registerAndLogin = async () => {
  const user = { name: 'AI User', email: `ai_${Date.now()}@test.com`, password: 'Password1' };
  const res = await request(app).post('/api/v1/auth/register').send(user);
  return res.body.data.accessToken;
};

const futureDate = new Date(Date.now() + 86400000).toISOString();

describe('Action Items API', () => {
  let token;
  let meetingId;

  beforeEach(async () => {
    token = await registerAndLogin();
    const m = await request(app)
      .post('/api/v1/meetings')
      .set({ Authorization: `Bearer ${token}` })
      .send({ title: 'AI Meeting', scheduledAt: futureDate });
    meetingId = m.body.data._id;
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  describe('POST /api/v1/action-items', () => {
    it('creates an action item', async () => {
      const res = await request(app)
        .post('/api/v1/action-items')
        .set(auth())
        .send({
          meetingId,
          title: 'Prepare release notes',
          priority: 'high',
          assignee: { name: 'Jordan', email: 'jordan@example.com' },
        });
      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Prepare release notes');
    });

    it('rejects missing title with 422', async () => {
      const res = await request(app)
        .post('/api/v1/action-items')
        .set(auth())
        .send({ meetingId });
      expect(res.status).toBe(422);
    });

    it('returns 404 for unknown meeting', async () => {
      const res = await request(app)
        .post('/api/v1/action-items')
        .set(auth())
        .send({ meetingId: '507f1f77bcf86cd799439099', title: 'Task' });
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/action-items', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/v1/action-items')
        .set(auth())
        .send({ meetingId, title: 'Task A' });
      await request(app)
        .post('/api/v1/action-items')
        .set(auth())
        .send({ meetingId, title: 'Task B', priority: 'critical' });
    });

    it('returns all action items paginated', async () => {
      const res = await request(app).get('/api/v1/action-items').set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(2);
    });

    it('filters by meetingId', async () => {
      const res = await request(app)
        .get(`/api/v1/action-items?meetingId=${meetingId}`)
        .set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThan(0);
    });

    it('filters by status', async () => {
      const res = await request(app)
        .get('/api/v1/action-items?status=pending')
        .set(auth());
      expect(res.status).toBe(200);
      res.body.data.items.forEach((i) => expect(i.status).toBe('pending'));
    });
  });

  describe('PATCH /api/v1/action-items/:id/status', () => {
    it('updates status to completed', async () => {
      const create = await request(app)
        .post('/api/v1/action-items')
        .set(auth())
        .send({ meetingId, title: 'Completable task' });
      const id = create.body.data._id;

      const res = await request(app)
        .patch(`/api/v1/action-items/${id}/status`)
        .set(auth())
        .send({ status: 'completed' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.completedAt).toBeDefined();
    });

    it('rejects invalid status with 422', async () => {
      const create = await request(app)
        .post('/api/v1/action-items')
        .set(auth())
        .send({ meetingId, title: 'Task' });
      const id = create.body.data._id;

      const res = await request(app)
        .patch(`/api/v1/action-items/${id}/status`)
        .set(auth())
        .send({ status: 'INVALID' });
      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/v1/action-items/overdue', () => {
    it('returns overdue items list (may be empty)', async () => {
      const res = await request(app).get('/api/v1/action-items/overdue').set(auth());
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
