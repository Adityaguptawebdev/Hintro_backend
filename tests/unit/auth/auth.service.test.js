const authService = require('../../../src/api/v1/auth/auth.service');
const User = require('../../../src/models/User.model');

describe('AuthService', () => {
  describe('register', () => {
    it('creates a user and returns token pair', async () => {
      const result = await authService.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password1',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.password).toBeUndefined();
    });

    it('throws conflict if email already registered', async () => {
      await authService.register({ name: 'A', email: 'dup@test.com', password: 'Password1' });
      await expect(
        authService.register({ name: 'B', email: 'dup@test.com', password: 'Password1' })
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe('login', () => {
    it('returns tokens on valid credentials', async () => {
      await authService.register({ name: 'Login Test', email: 'login@test.com', password: 'Password1' });
      const result = await authService.login({ email: 'login@test.com', password: 'Password1' });
      expect(result.accessToken).toBeDefined();
    });

    it('throws unauthorized on wrong password', async () => {
      await authService.register({ name: 'X', email: 'x@test.com', password: 'Correct1' });
      await expect(
        authService.login({ email: 'x@test.com', password: 'wrongPass1' })
      ).rejects.toMatchObject({ statusCode: 401 });
    });
  });
});
