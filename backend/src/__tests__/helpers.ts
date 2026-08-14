import request from 'supertest';
import type { Express } from 'express';
import Template from '../models/Template';
import Resume from '../models/Resume';

export async function registerUser(
  app: Express,
  overrides: { name?: string; email?: string; password?: string } = {}
) {
  const body = {
    name: 'Alice Owner',
    email: 'alice@example.com',
    password: 'correct-password',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(body);
  return { res, body };
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function seedOwnedResume(ownerId: string) {
  const template = await Template.create({
    name: 'Test Template',
    html: '<html><body>{{name}}</body></html>',
  });

  const resume = await Resume.create({
    user: ownerId,
    template: template._id,
    data: {
      name: 'Alice Owner',
      title: 'Engineer',
      summary: 'A sufficiently long professional summary.',
    },
    pdfUrl: '/tmp/resume-maker/does-not-need-to-exist.pdf',
  });

  return { template, resume };
}
