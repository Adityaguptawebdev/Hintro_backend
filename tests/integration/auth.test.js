require('../fixtures/setup');

const request = require('supertest');
const app = require('../../src/app');

describe('Auth API', () => {
  const validUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Password1',
  };

  describe('POST /api/v1/auth/register', () => {
    it('creates a new user and returns token pair', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(validUser);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user.password).toBeUndefined();
      expect(res.body.traceId).toBeDefined();
    });

    it('rejects duplicate email with 409', async () => {
      await request(app).post('/api/v1/auth/register').send(validUser);
      const res = await request(app).post('/api/v1/auth/register').send(validUser);
      expect(res.status).toBe(409);
    });

    it('rejects weak password missing uppercase with 422', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validUser, email: 'weak1@test.com', password: 'alllower1' });
      expect(res.status).toBe(422);
    });

    it('rejects password with no number with 422', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validUser, email: 'weak2@test.com', password: 'NoNumbers' });
      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send(validUser);
    });

    it('returns tokens on valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: validUser.email, password: validUser.password });
      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('rejects wrong password with 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: validUser.email, password: 'wrongPass1' });
      expect(res.status).toBe(401);
    });

    it('rejects unknown email with 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@example.com', password: 'Password1' });
      expect(res.status).toBe(401);
    });
  });
});
