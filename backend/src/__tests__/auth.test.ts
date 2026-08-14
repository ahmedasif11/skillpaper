import request from 'supertest';
import app from '../app';
import { registerUser } from './helpers';

describe('Auth API', () => {
  it('POST /api/auth/register valid → 201, token, user without password', async () => {
    const { res } = await registerUser(app);

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.token.length).toBeGreaterThan(10);
    expect(res.body.user).toMatchObject({
      name: 'Alice Owner',
      email: 'alice@example.com',
    });
    expect(res.body.user.id).toBeDefined();
    expect(res.body.user).not.toHaveProperty('password');
    expect(JSON.stringify(res.body)).not.toMatch(/"password"\s*:/);
  });

  it('POST /api/auth/register weak or invalid → 400', async () => {
    const shortPassword = await request(app).post('/api/auth/register').send({
      name: 'Alice Owner',
      email: 'alice@example.com',
      password: 'short',
    });
    expect(shortPassword.status).toBe(400);

    const invalidEmail = await request(app).post('/api/auth/register').send({
      name: 'Alice Owner',
      email: 'not-an-email',
      password: 'correct-password',
    });
    expect(invalidEmail.status).toBe(400);

    const missingName = await request(app).post('/api/auth/register').send({
      email: 'alice@example.com',
      password: 'correct-password',
    });
    expect(missingName.status).toBe(400);
  });

  it('POST /api/auth/login wrong password → 401', async () => {
    await registerUser(app);

    const res = await request(app).post('/api/auth/login').send({
      email: 'alice@example.com',
      password: 'wrong-password',
    });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ message: 'Invalid credentials' });
    expect(res.body.token).toBeUndefined();
  });
});
