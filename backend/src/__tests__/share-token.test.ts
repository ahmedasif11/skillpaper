import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import request from 'supertest';
import app from '../app';
import { authHeader, registerUser, seedOwnedResume } from './helpers';

describe('Share token entropy', () => {
  it('uses crypto.randomBytes-style tokens: hex, unique, not Math.random', async () => {
    const controllerPath = path.join(
      __dirname,
      '..',
      'controllers',
      'resume.controller.ts'
    );
    const source = fs.readFileSync(controllerPath, 'utf8');

    expect(source).toMatch(/crypto\.randomBytes\s*\(/);
    expect(source).not.toMatch(/shareToken[^\n]*=[^\n]*Math\.random/);

    const { res: ownerRes } = await registerUser(app);
    const { resume } = await seedOwnedResume(ownerRes.body.user.id);
    const headers = authHeader(ownerRes.body.token);

    const randomBytesSpy = jest.spyOn(crypto, 'randomBytes');

    const first = await request(app)
      .post(`/api/resumes/${resume._id}/share`)
      .set(headers)
      .send({ expiresInDays: 1 });
    const second = await request(app)
      .post(`/api/resumes/${resume._id}/share`)
      .set(headers)
      .send({ expiresInDays: 1 });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(randomBytesSpy).toHaveBeenCalled();

    const tokenA = first.body.shareToken as string;
    const tokenB = second.body.shareToken as string;

    expect(tokenA).toMatch(/^[0-9a-f]{64}$/);
    expect(tokenB).toMatch(/^[0-9a-f]{64}$/);
    expect(tokenA).not.toEqual(tokenB);

    randomBytesSpy.mockRestore();
  });
});
