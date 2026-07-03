require('../fixtures/setup');

const request = require('supertest');
const app = require('../../src/app');

const registerAndLogin = async () => {
  const user = { name: 'Meeting User', email: `mu_${Date.now()}@test.com`, password: 'Password1' };
  const res = await request(app).post('/api/v1/auth/register').send(user);
  return res.body.data.accessToken;
};

const futureDate = new Date(Date.now() + 86400000).toISOString();

describe('Meetings API', () => {
  let token;

  beforeEach(async () => {
    token = await registerAndLogin();
  });

  const authHeader = () => ({ Authorization: `Bearer ${token}` });

  describe('POST /api/v1/meetings', () => {
    it('creates a meeting', async () => {
      const res = await request(app)
        .post('/api/v1/meetings')
        .set(authHeader())
        .send({ title: 'Kickoff', scheduledAt: futureDate });
      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Kickoff');
      expect(res.body.traceId).toBeDefined();
    });

    it('rejects missing title with 422', async () => {
      const res = await request(app)
        .post('/api/v1/meetings')
        .set(authHeader())
        .send({ scheduledAt: futureDate });
      expect(res.status).toBe(422);
    });

    it('returns 401 without auth token', async () => {
      const res = await request(app)
        .post('/api/v1/meetings')
        .send({ title: 'Test', scheduledAt: futureDate });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/meetings', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/v1/meetings')
        .set(authHeader())
        .send({ title: 'Meeting One', scheduledAt: futureDate });
    });

    it('returns paginated list', async () => {
      const res = await request(app).get('/api/v1/meetings').set(authHeader());
      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.pagination).toBeDefined();
    });
  });

  describe('GET /api/v1/meetings/:id', () => {
    it('returns 404 for unknown id', async () => {
      const res = await request(app)
        .get('/api/v1/meetings/507f1f77bcf86cd799439011')
        .set(authHeader());
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/meetings/:id', () => {
    it('updates a meeting', async () => {
      const create = await request(app)
        .post('/api/v1/meetings')
        .set(authHeader())
        .send({ title: 'Original', scheduledAt: futureDate });
      const id = create.body.data._id;

      const res = await request(app)
        .patch(`/api/v1/meetings/${id}`)
        .set(authHeader())
        .send({ title: 'Updated' });
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated');
    });
  });

  describe('DELETE /api/v1/meetings/:id', () => {
    it('deletes a meeting and returns 204', async () => {
      const create = await request(app)
        .post('/api/v1/meetings')
        .set(authHeader())
        .send({ title: 'Temp', scheduledAt: futureDate });
      const id = create.body.data._id;

      const res = await request(app).delete(`/api/v1/meetings/${id}`).set(authHeader());
      expect(res.status).toBe(204);
    });
  });
});
