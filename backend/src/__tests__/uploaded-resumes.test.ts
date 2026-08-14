import request from 'supertest';
import app from '../app';
import UploadedResume from '../models/UploadedResume';
import Resume from '../models/Resume';
import Template from '../models/Template';
import { getStorage } from '../container';
import { MockStorageAdapter } from '../adapters/storage/mockStorage.adapter';
import { authHeader, registerUser } from './helpers';
import { MAX_UPLOADED_RESUMES_PER_USER } from '../middlewares/upload';

const MIN_PDF = Buffer.from(
  '%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n%%EOF\n'
);
const EICAR_PDF = Buffer.concat([
  Buffer.from('%PDF-1.4\n'),
  Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*'),
]);
const FAKE_PDF_BYTES = Buffer.from('not-a-pdf-file-at-all');
const MIN_DOCX = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00]);

async function uploadPdf(
  token: string,
  extra: { filename?: string; label?: string; body?: Buffer } = {}
) {
  const req = request(app)
    .post('/api/uploaded-resumes')
    .set(authHeader(token))
    .attach('file', extra.body ?? MIN_PDF, extra.filename ?? 'cv.pdf');
  if (extra.label) {
    req.field('label', extra.label);
  }
  return req;
}

describe('Uploaded resume library (Phase 1)', () => {
  it('POST without auth → 401', async () => {
    const res = await request(app)
      .post('/api/uploaded-resumes')
      .attach('file', MIN_PDF, 'cv.pdf');
    expect(res.status).toBe(401);
  });

  it('POST valid PDF → 201, stored, queued, and listed for owner only', async () => {
    const { res: ownerRes } = await registerUser(app);
    const token = ownerRes.body.token;

    const created = await uploadPdf(token, { label: 'Software Engineer Resume' });
    expect(created.status).toBe(201);
    expect(created.body.success).toBe(true);
    expect(created.body.data).toMatchObject({
      label: 'Software Engineer Resume',
      filename: 'cv.pdf',
      mimeType: 'application/pdf',
      status: 'uploaded',
    });
    expect(created.body.data.id).toBeDefined();

    const id = created.body.data.id;
    const doc = await UploadedResume.findById(id);
    expect(doc).not.toBeNull();
    const storage = getStorage() as MockStorageAdapter;
    expect(storage.has(doc!.minioKey)).toBe(true);

    const { res: otherRes } = await registerUser(app, {
      name: 'Bob Intruder',
      email: 'bob@example.com',
      password: 'other-password',
    });

    const ownerList = await request(app)
      .get('/api/uploaded-resumes')
      .set(authHeader(token));
    expect(ownerList.status).toBe(200);
    expect(ownerList.body.total).toBe(1);
    expect(ownerList.body.data[0].id).toBe(id);
    expect(ownerList.body.data[0].status).toBe('parsing');

    const otherList = await request(app)
      .get('/api/uploaded-resumes')
      .set(authHeader(otherRes.body.token));
    expect(otherList.status).toBe(200);
    expect(otherList.body.total).toBe(0);
  });

  it('POST missing file → 400', async () => {
    const { res: ownerRes } = await registerUser(app);
    const res = await request(app)
      .post('/api/uploaded-resumes')
      .set(authHeader(ownerRes.body.token));
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST unsupported type → 415', async () => {
    const { res: ownerRes } = await registerUser(app);
    const res = await request(app)
      .post('/api/uploaded-resumes')
      .set(authHeader(ownerRes.body.token))
      .attach('file', Buffer.from('hello'), {
        filename: 'note.txt',
        contentType: 'text/plain',
      });
    expect(res.status).toBe(415);
    expect(res.body.code).toBe('UNSUPPORTED_FORMAT');
  });

  it('POST magic-byte mismatch → 422', async () => {
    const { res: ownerRes } = await registerUser(app);
    const res = await request(app)
      .post('/api/uploaded-resumes')
      .set(authHeader(ownerRes.body.token))
      .attach('file', FAKE_PDF_BYTES, {
        filename: 'cv.pdf',
        contentType: 'application/pdf',
      });
    expect(res.status).toBe(422);
  });

  it('POST DOCX with zip magic bytes → 201', async () => {
    const { res: ownerRes } = await registerUser(app);
    const res = await request(app)
      .post('/api/uploaded-resumes')
      .set(authHeader(ownerRes.body.token))
      .attach('file', MIN_DOCX, {
        filename: 'cv.docx',
        contentType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.mimeType).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
  });

  it('POST EICAR PDF → scan fails, object removed, status failed:scan', async () => {
    const { res: ownerRes } = await registerUser(app);
    const created = await uploadPdf(ownerRes.body.token, {
      body: EICAR_PDF,
      filename: 'eicar.pdf',
    });
    expect(created.status).toBe(201);

    const doc = await UploadedResume.findById(created.body.data.id);
    expect(doc?.status).toBe('failed:scan');
    const storage = getStorage() as MockStorageAdapter;
    expect(storage.has(doc!.minioKey)).toBe(false);
  });

  it('DELETE as another user → 403; owner deletes DB + storage and nullifies Resume link', async () => {
    const { res: ownerRes } = await registerUser(app);
    const created = await uploadPdf(ownerRes.body.token);
    const id = created.body.data.id;
    const uploaded = await UploadedResume.findById(id);

    const template = await Template.create({
      name: 'Test Template',
      html: '<html><body>{{name}}</body></html>',
    });
    await Resume.create({
      user: ownerRes.body.user.id,
      template: template._id,
      data: { name: 'Alice Owner', title: 'Engineer', summary: 'A sufficiently long professional summary.' },
      sourceUploadedResumeId: uploaded!._id,
    });

    const { res: otherRes } = await registerUser(app, {
      name: 'Bob Intruder',
      email: 'bob@example.com',
      password: 'other-password',
    });

    const denied = await request(app)
      .delete(`/api/uploaded-resumes/${id}`)
      .set(authHeader(otherRes.body.token));
    expect(denied.status).toBe(403);

    const storage = getStorage() as MockStorageAdapter;
    expect(storage.has(uploaded!.minioKey)).toBe(true);

    const deleted = await request(app)
      .delete(`/api/uploaded-resumes/${id}`)
      .set(authHeader(ownerRes.body.token));
    expect(deleted.status).toBe(200);
    expect(deleted.body.data.message).toMatch(/deleted/i);

    expect(await UploadedResume.findById(id)).toBeNull();
    expect(storage.has(uploaded!.minioKey)).toBe(false);

    const linked = await Resume.findOne({ template: template._id });
    expect(linked?.sourceUploadedResumeId).toBeNull();
  });

  it('DELETE invalid id → 400', async () => {
    const { res: ownerRes } = await registerUser(app);
    const res = await request(app)
      .delete('/api/uploaded-resumes/not-an-objectid')
      .set(authHeader(ownerRes.body.token));
    expect(res.status).toBe(400);
  });

  it('POST over quota → 429 QUOTA_EXCEEDED', async () => {
    const { res: ownerRes } = await registerUser(app);
    const userId = ownerRes.body.user.id;
    await UploadedResume.insertMany(
      Array.from({ length: MAX_UPLOADED_RESUMES_PER_USER }, (_, i) => ({
        user: userId,
        label: `Resume ${i}`,
        filename: `r${i}.pdf`,
        fileSize: 100,
        mimeType: 'application/pdf',
        minioKey: `${userId}/quota/${i}.pdf`,
        status: 'uploaded',
      }))
    );

    const res = await uploadPdf(ownerRes.body.token);
    expect(res.status).toBe(429);
    expect(res.body.code).toBe('QUOTA_EXCEEDED');
  });
});
