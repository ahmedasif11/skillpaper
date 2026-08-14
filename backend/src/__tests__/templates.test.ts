import request from 'supertest';
import app from '../app';
import { authHeader, registerUser } from './helpers';

describe('Template API security', () => {
  it('POST /api/templates as non-admin → 403', async () => {
    const { res: userRes } = await registerUser(app);

    const res = await request(app)
      .post('/api/templates')
      .set(authHeader(userRes.body.token))
      .send({
        name: 'Injected Template',
        html: '<html><body>injected</body></html>',
      });

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ message: 'Access denied' });
  });
});
