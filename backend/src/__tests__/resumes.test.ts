import crypto from 'crypto';
import fs from 'fs';
import request from 'supertest';
import puppeteer from 'puppeteer';
import app from '../app';
import Resume from '../models/Resume';
import { authHeader, registerUser, seedOwnedResume } from './helpers';

describe('Resume API security', () => {
  it('GET /api/resumes/:id as another user → 403', async () => {
    const { res: ownerRes } = await registerUser(app);
    const ownerId = ownerRes.body.user.id;
    const { resume } = await seedOwnedResume(ownerId);

    const { res: otherRes } = await registerUser(app, {
      name: 'Bob Intruder',
      email: 'bob@example.com',
      password: 'other-password',
    });

    const res = await request(app)
      .get(`/api/resumes/${resume._id}`)
      .set(authHeader(otherRes.body.token));

    expect(res.status).toBe(403);
  });

  it('GET /api/resumes/:id/download as another user → 403', async () => {
    const { res: ownerRes } = await registerUser(app);
    const { resume } = await seedOwnedResume(ownerRes.body.user.id);

    const { res: otherRes } = await registerUser(app, {
      name: 'Bob Intruder',
      email: 'bob@example.com',
      password: 'other-password',
    });

    const res = await request(app)
      .get(`/api/resumes/${resume._id}/download`)
      .set(authHeader(otherRes.body.token));

    expect(res.status).toBe(403);
  });

  it('GET /api/resumes/not-an-objectid → 400', async () => {
    const { res: ownerRes } = await registerUser(app);

    const res = await request(app)
      .get('/api/resumes/not-an-objectid')
      .set(authHeader(ownerRes.body.token));

    expect(res.status).toBe(400);
  });

  it('GET /api/resumes/public/:token after expiry → 410', async () => {
    const { res: ownerRes } = await registerUser(app);
    const { resume } = await seedOwnedResume(ownerRes.body.user.id);

    resume.isPublic = true;
    resume.shareToken = crypto.randomBytes(32).toString('hex');
    resume.shareExpiresAt = new Date(Date.now() - 60_000);
    await resume.save();

    const res = await request(app).get(
      `/api/resumes/public/${resume.shareToken}`
    );

    expect(res.status).toBe(410);
  });

  it('POST /api/resumes/cleanup without auth → 401', async () => {
    const res = await request(app).post('/api/resumes/cleanup');
    expect(res.status).toBe(401);
  });

  it('GET /api/resumes/:id/download regenerates a missing PDF for the owner', async () => {
    (puppeteer.launch as jest.Mock).mockClear();

    const { res: ownerRes } = await registerUser(app);
    const { resume } = await seedOwnedResume(ownerRes.body.user.id);
    const missingPath = resume.pdfUrl;
    expect(fs.existsSync(missingPath!)).toBe(false);

    const res = await request(app)
      .get(`/api/resumes/${resume._id}/download`)
      .set(authHeader(ownerRes.body.token));

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/pdf/);
    expect(puppeteer.launch).toHaveBeenCalled();

    const updated = await Resume.findById(resume._id);
    expect(updated?.pdfUrl).toBeTruthy();
    expect(updated?.pdfUrl).not.toBe(missingPath);
    expect(fs.existsSync(updated!.pdfUrl!)).toBe(true);

    fs.unlinkSync(updated!.pdfUrl!);
  });

  it('GET /api/resumes/public/:token/download regenerates a missing PDF for a valid share', async () => {
    (puppeteer.launch as jest.Mock).mockClear();

    const { res: ownerRes } = await registerUser(app);
    const { resume } = await seedOwnedResume(ownerRes.body.user.id);
    resume.isPublic = true;
    resume.shareToken = crypto.randomBytes(32).toString('hex');
    resume.shareExpiresAt = new Date(Date.now() + 60_000);
    await resume.save();
    const missingPath = resume.pdfUrl;

    const res = await request(app).get(
      `/api/resumes/public/${resume.shareToken}/download`
    );

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/pdf/);
    expect(puppeteer.launch).toHaveBeenCalled();

    const updated = await Resume.findById(resume._id);
    expect(updated?.pdfUrl).toBeTruthy();
    expect(updated?.pdfUrl).not.toBe(missingPath);
    expect(fs.existsSync(updated!.pdfUrl!)).toBe(true);

    fs.unlinkSync(updated!.pdfUrl!);
  });

  it('GET /api/resumes/:id/download as another user → 403 and does not regenerate', async () => {
    (puppeteer.launch as jest.Mock).mockClear();

    const { res: ownerRes } = await registerUser(app);
    const { resume } = await seedOwnedResume(ownerRes.body.user.id);
    const missingPath = resume.pdfUrl;

    const { res: otherRes } = await registerUser(app, {
      name: 'Bob Intruder',
      email: 'bob@example.com',
      password: 'other-password',
    });

    const res = await request(app)
      .get(`/api/resumes/${resume._id}/download`)
      .set(authHeader(otherRes.body.token));

    expect(res.status).toBe(403);
    expect(puppeteer.launch).not.toHaveBeenCalled();

    const unchanged = await Resume.findById(resume._id);
    expect(unchanged?.pdfUrl).toBe(missingPath);
  });

  it('GET /api/resumes/public/:token/download after expiry → 410 and does not regenerate', async () => {
    (puppeteer.launch as jest.Mock).mockClear();

    const { res: ownerRes } = await registerUser(app);
    const { resume } = await seedOwnedResume(ownerRes.body.user.id);
    resume.isPublic = true;
    resume.shareToken = crypto.randomBytes(32).toString('hex');
    resume.shareExpiresAt = new Date(Date.now() - 60_000);
    await resume.save();
    const missingPath = resume.pdfUrl;

    const res = await request(app).get(
      `/api/resumes/public/${resume.shareToken}/download`
    );

    expect(res.status).toBe(410);
    expect(puppeteer.launch).not.toHaveBeenCalled();

    const unchanged = await Resume.findById(resume._id);
    expect(unchanged?.pdfUrl).toBe(missingPath);
  });

  it('PUT /api/resumes/:id keeps skills, projects, languages, references, additionalSections', async () => {
    const { res: ownerRes } = await registerUser(app);
    const { resume } = await seedOwnedResume(ownerRes.body.user.id);

    const data = {
      name: 'Alice Owner',
      email: 'alice@example.com',
      phone: '1234567890',
      location: 'Karachi',
      summary: 'A sufficiently long professional summary.',
      skills: [{ category: 'Languages', items: ['TypeScript'] }],
      projects: [
        {
          name: 'SkillPaper',
          description: 'A resume builder with enough description.',
        },
      ],
      languages: [{ language: 'English', proficiency: 'Fluent' }],
      references: [
        {
          name: 'Jane Doe',
          position: 'Manager',
          company: 'Acme',
          email: 'jane@example.com',
        },
      ],
      additionalSections: [
        { title: 'Volunteer', content: 'Community work that is long enough.' },
      ],
      achievements: ['Shipped the product'],
    };

    const res = await request(app)
      .put(`/api/resumes/${resume._id}`)
      .set(authHeader(ownerRes.body.token))
      .send({ data });

    expect(res.status).toBe(200);
    expect(res.body.resume.data).toMatchObject({
      location: 'Karachi',
      skills: [{ category: 'Languages', items: ['TypeScript'] }],
      projects: [expect.objectContaining({ name: 'SkillPaper' })],
      languages: [{ language: 'English', proficiency: 'Fluent' }],
      references: [expect.objectContaining({ email: 'jane@example.com' })],
      additionalSections: [expect.objectContaining({ title: 'Volunteer' })],
      achievements: ['Shipped the product'],
    });
  });
});
