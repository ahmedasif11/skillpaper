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
    expect(ownerList.body.data[0].status).toBe('ready');
    expect(ownerList.body.data[0].confidenceScore).toBeGreaterThan(0);

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

describe('Uploaded resume parse APIs (Phase 2)', () => {
  it('GET :id metadata, status, and parsed data for owner; 403 for others', async () => {
    const { res: ownerRes } = await registerUser(app);
    const token = ownerRes.body.token;
    const created = await uploadPdf(token, { label: 'Software Engineer Resume' });
    const id = created.body.data.id;

    const meta = await request(app)
      .get(`/api/uploaded-resumes/${id}`)
      .set(authHeader(token));
    expect(meta.status).toBe(200);
    expect(meta.body.data).toMatchObject({
      id,
      label: 'Software Engineer Resume',
      status: 'ready',
      mimeType: 'application/pdf',
    });
    expect(meta.body.data.parsedData).toBeUndefined();
    expect(meta.body.data.confidenceScore).toEqual(expect.any(Number));

    const status = await request(app)
      .get(`/api/uploaded-resumes/${id}/status`)
      .set(authHeader(token));
    expect(status.status).toBe(200);
    expect(status.body.data.status).toBe('ready');
    expect(status.body.data.progressHint).toBeDefined();

    const data = await request(app)
      .get(`/api/uploaded-resumes/${id}/data`)
      .set(authHeader(token));
    expect(data.status).toBe(200);
    expect(data.body.data.parsedData.name).toBe('Jane Doe');
    expect(data.body.data.parsedData.email).toBe('jane@example.com');

    const { res: otherRes } = await registerUser(app, {
      name: 'Bob Intruder',
      email: 'bob@example.com',
      password: 'other-password',
    });
    const denied = await request(app)
      .get(`/api/uploaded-resumes/${id}`)
      .set(authHeader(otherRes.body.token));
    expect(denied.status).toBe(403);
  });

  it('GET :id/data when scan failed → 409 PARSE_NOT_READY', async () => {
    const { res: ownerRes } = await registerUser(app);
    const created = await uploadPdf(ownerRes.body.token, {
      body: EICAR_PDF,
      filename: 'eicar.pdf',
    });
    const res = await request(app)
      .get(`/api/uploaded-resumes/${created.body.data.id}/data`)
      .set(authHeader(ownerRes.body.token));
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('PARSE_NOT_READY');
  });

  it('POST :id/reparse enqueues and returns 202; blocked while scanning', async () => {
    const { res: ownerRes } = await registerUser(app);
    const token = ownerRes.body.token;
    const created = await uploadPdf(token);
    const id = created.body.data.id;

    const reparsing = await request(app)
      .post(`/api/uploaded-resumes/${id}/reparse`)
      .set(authHeader(token));
    expect(reparsing.status).toBe(202);
    expect(reparsing.body.data.message).toMatch(/re-parse/i);

    const after = await request(app)
      .get(`/api/uploaded-resumes/${id}/status`)
      .set(authHeader(token));
    expect(after.body.data.status).toBe('ready');

    await UploadedResume.findByIdAndUpdate(id, { status: 'scanning' });
    const blocked = await request(app)
      .post(`/api/uploaded-resumes/${id}/reparse`)
      .set(authHeader(token));
    expect(blocked.status).toBe(409);
    expect(blocked.body.code).toBe('REPARSE_IN_PROGRESS');
  });

  it('PUT :id/file same hash → unchanged; different hash → re-parse', async () => {
    const { res: ownerRes } = await registerUser(app);
    const token = ownerRes.body.token;
    const created = await uploadPdf(token);
    const id = created.body.data.id;

    const same = await request(app)
      .put(`/api/uploaded-resumes/${id}/file`)
      .set(authHeader(token))
      .attach('file', MIN_PDF, 'cv.pdf');
    expect(same.status).toBe(200);
    expect(same.body.data.changed).toBe(false);

    const otherPdf = Buffer.concat([MIN_PDF, Buffer.from('\n% extra\n')]);
    const changed = await request(app)
      .put(`/api/uploaded-resumes/${id}/file`)
      .set(authHeader(token))
      .attach('file', otherPdf, 'cv2.pdf');
    expect(changed.status).toBe(200);
    expect(changed.body.data.changed).toBe(true);

    const data = await request(app)
      .get(`/api/uploaded-resumes/${id}/data`)
      .set(authHeader(token));
    expect(data.status).toBe(200);
    expect(data.body.data.parsedData.name).toBe('Jane Doe');
  });
});

describe('Uploaded resume rename and download (Phase 4 slice)', () => {
  it('PUT :id as owner → 200 with updated label only', async () => {
    const { res: ownerRes } = await registerUser(app);
    const token = ownerRes.body.token;
    const created = await uploadPdf(token, { label: 'Old Label' });
    const id = created.body.data.id;
    const before = await UploadedResume.findById(id);

    const renamed = await request(app)
      .put(`/api/uploaded-resumes/${id}`)
      .set(authHeader(token))
      .send({ label: '  New Resume Label  ' });
    expect(renamed.status).toBe(200);
    expect(renamed.body.success).toBe(true);
    expect(renamed.body.data).toMatchObject({
      id,
      label: 'New Resume Label',
    });
    expect(renamed.body.data.updatedAt).toBeDefined();

    const after = await UploadedResume.findById(id);
    expect(after?.label).toBe('New Resume Label');
    expect(after?.filename).toBe(before?.filename);
    expect(after?.minioKey).toBe(before?.minioKey);
    expect(after?.fileHash).toBe(before?.fileHash);
    expect(after?.status).toBe(before?.status);
  });

  it('PUT :id as another user → 403', async () => {
    const { res: ownerRes } = await registerUser(app);
    const created = await uploadPdf(ownerRes.body.token, { label: 'Mine' });
    const { res: otherRes } = await registerUser(app, {
      name: 'Bob Intruder',
      email: 'bob@example.com',
      password: 'other-password',
    });

    const denied = await request(app)
      .put(`/api/uploaded-resumes/${created.body.data.id}`)
      .set(authHeader(otherRes.body.token))
      .send({ label: 'Hijacked' });
    expect(denied.status).toBe(403);

    const doc = await UploadedResume.findById(created.body.data.id);
    expect(doc?.label).toBe('Mine');
  });

  it('PUT :id invalid id → 400', async () => {
    const { res: ownerRes } = await registerUser(app);
    const res = await request(app)
      .put('/api/uploaded-resumes/not-an-objectid')
      .set(authHeader(ownerRes.body.token))
      .send({ label: 'Anything' });
    expect(res.status).toBe(400);
  });

  it('GET :id/download as owner → 200 with url, expiresIn, filename', async () => {
    const { res: ownerRes } = await registerUser(app);
    const token = ownerRes.body.token;
    const created = await uploadPdf(token, { filename: 'cv.pdf' });
    const id = created.body.data.id;

    const downloaded = await request(app)
      .get(`/api/uploaded-resumes/${id}/download`)
      .set(authHeader(token));
    expect(downloaded.status).toBe(200);
    expect(downloaded.body.success).toBe(true);
    expect(downloaded.body.data.filename).toBe('cv.pdf');
    expect(downloaded.body.data.expiresIn).toBe(3600);
    expect(typeof downloaded.body.data.url).toBe('string');
    expect(downloaded.body.data.url.length).toBeGreaterThan(0);
  });

  it('GET :id/download as another user → 403', async () => {
    const { res: ownerRes } = await registerUser(app);
    const created = await uploadPdf(ownerRes.body.token);
    const { res: otherRes } = await registerUser(app, {
      name: 'Bob Intruder',
      email: 'bob@example.com',
      password: 'other-password',
    });

    const denied = await request(app)
      .get(`/api/uploaded-resumes/${created.body.data.id}/download`)
      .set(authHeader(otherRes.body.token));
    expect(denied.status).toBe(403);
  });
});
