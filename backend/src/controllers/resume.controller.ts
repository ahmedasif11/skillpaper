// src/controllers/resume.controller.ts
import { Request, Response } from 'express';
import crypto from 'crypto';
import Resume, { IResume } from '../models/Resume';
import Template from '../models/Template';
import User from '../models/User';
import {
  generatePdfFromTemplate,
  generatePdfPreview,
  deletePdfFile,
  cleanupOldPdfs,
  ensurePdfFile,
} from '../services/pdf.service';
import fs from 'fs';
import { isValidObjectId } from '../utils/objectId';
import { isResumeOwner } from '../utils/assertResumeOwner';

/**
 * POST /api/resumes
 * Body: { templateId, data }
 * Protected route - req.user must exist
 */
export const createResume = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const { templateId, data } = req.body;
    const template = await Template.findById(templateId);
    if (!template)
      return res.status(404).json({ message: 'Template not found' });

    // generate pdf
    const { buffer, filePath } = await generatePdfFromTemplate(
      template.html,
      data
    );

    // save resume entry
    const resume = new Resume({
      user: user._id,
      template: template._id,
      data,
      pdfUrl: filePath, // local path; in prod upload to S3 and save URL
    });
    await resume.save();

    // Update user's profile data for auto-fill in future resume creations
    await User.findByIdAndUpdate(user._id, { profileData: data });

    res.status(201).json({ resume });
  } catch (err) {
    console.error('Create resume error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/resumes/:id
 */
export const getResume = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid resume id' });
    }

    const resume = await Resume.findById(id)
      .populate('template')
      .populate('user', '-password');
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    if (!isResumeOwner(resume, String(user._id))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ resume });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/resumes/user
 * Get all resumes for the authenticated user
 */
export const getUserResumes = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const resumes = await Resume.find({ user: user._id })
      .populate('template', 'name preview')
      .sort({ createdAt: -1 });

    res.json({ resumes });
  } catch (err) {
    console.error('Get user resumes error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/resumes/:id/download
 * Serves the PDF file stored in pdfUrl
 */
export const downloadResume = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid resume id' });
    }

    const resume = await Resume.findById(id).populate('template');
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    if (!isResumeOwner(resume, String(user._id))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    return streamResumePdf(resume, res, `resume-${resume._id}.pdf`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/resumes/:id/regenerate
 * Regenerate PDF for an existing resume
 */
export const regenerateResumePdf = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const { id } = req.params;
    const resume = await Resume.findById(id).populate('template');

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Check if user owns the resume
    if (resume.user.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete old PDF file if it exists
    if (resume.pdfUrl && fs.existsSync(resume.pdfUrl)) {
      deletePdfFile(resume.pdfUrl);
    }

    // Generate new PDF
    const { buffer, filePath } = await generatePdfFromTemplate(
      (resume.template as any).html,
      resume.data
    );

    // Update resume with new PDF path
    resume.pdfUrl = filePath;
    await resume.save();

    res.json({
      message: 'PDF regenerated successfully',
      resume: {
        id: resume._id,
        pdfUrl: `/api/resumes/${resume._id}/download`,
      },
    });
  } catch (err) {
    console.error('Regenerate PDF error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/resumes/:id/preview
 * Get PDF as base64 for preview
 */
export const previewResumePdf = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const { id } = req.params;
    const resume = await Resume.findById(id).populate('template');

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Check if user owns the resume
    if (resume.user.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Generate PDF preview
    const pdfBase64 = await generatePdfPreview(
      (resume.template as any).html,
      resume.data
    );

    res.json({
      pdf: pdfBase64,
      filename: `resume-${resume._id}.pdf`,
    });
  } catch (err) {
    console.error('Preview PDF error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * PUT /api/resumes/:id
 * Update resume data and regenerate PDF
 */
export const updateResume = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const { id } = req.params;
    const { data } = req.body;

    const resume = await Resume.findById(id).populate('template');

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Check if user owns the resume
    if (resume.user.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update resume data
    resume.data = data;

    // Delete old PDF file if it exists
    if (resume.pdfUrl && fs.existsSync(resume.pdfUrl)) {
      deletePdfFile(resume.pdfUrl);
    }

    // Generate new PDF with updated data
    const { buffer, filePath } = await generatePdfFromTemplate(
      (resume.template as any).html,
      data
    );

    // Update resume with new PDF path
    resume.pdfUrl = filePath;
    await resume.save();

    // Update user's profile data for auto-fill in future resume creations
    await User.findByIdAndUpdate(user._id, { profileData: data });

    res.json({
      message: 'Resume updated successfully',
      resume,
    });
  } catch (err) {
    console.error('Update resume error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * DELETE /api/resumes/:id
 * Delete resume and its PDF file
 */
export const deleteResume = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const { id } = req.params;
    const resume = await Resume.findById(id);

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Check if user owns the resume
    if (resume.user.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete PDF file if it exists
    if (resume.pdfUrl && fs.existsSync(resume.pdfUrl)) {
      deletePdfFile(resume.pdfUrl);
    }

    // Delete resume from database
    await Resume.findByIdAndDelete(id);

    res.json({ message: 'Resume deleted successfully' });
  } catch (err) {
    console.error('Delete resume error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/resumes/cleanup
 * Clean up old PDF files (admin function)
 */
export const cleanupOldPdfsEndpoint = async (req: Request, res: Response) => {
  try {
    const expected = process.env.CLEANUP_TOKEN?.trim() ?? '';
    const provided = req.header('x-cleanup-token') ?? '';
    if (!expected || !timingSafeEqualString(expected, provided)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    cleanupOldPdfs();
    res.json({ message: 'Old PDF files cleaned up successfully' });
  } catch (err) {
    console.error('Cleanup error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

function timingSafeEqualString(expected: string, provided: string): boolean {
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(provided);
  if (expectedBuf.length !== providedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}

/**
 * POST /api/resumes/:id/share
 * Create a shareable link for the resume
 */
export const shareResume = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const { id } = req.params;
    const { expiresInDays = 30 } = req.body;

    const resume = await Resume.findById(id);

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Check if user owns the resume
    if (resume.user.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const shareToken = crypto.randomBytes(32).toString('hex');
    const shareExpiresAt = new Date();
    shareExpiresAt.setDate(shareExpiresAt.getDate() + expiresInDays);

    // Update resume with sharing info
    resume.isPublic = true;
    resume.shareToken = shareToken;
    resume.shareExpiresAt = shareExpiresAt;
    await resume.save();

    const shareUrl = `${req.protocol}://${req.get(
      'host'
    )}/api/resumes/public/${shareToken}`;

    res.json({
      message: 'Resume shared successfully',
      shareUrl,
      expiresAt: shareExpiresAt,
      shareToken,
    });
  } catch (err) {
    console.error('Share resume error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/resumes/:id/unshare
 * Remove sharing from the resume
 */
export const unshareResume = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const { id } = req.params;
    const resume = await Resume.findById(id);

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Check if user owns the resume
    if (resume.user.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Remove sharing info
    resume.isPublic = false;
    resume.shareToken = undefined;
    resume.shareExpiresAt = undefined;
    await resume.save();

    res.json({ message: 'Resume sharing removed successfully' });
  } catch (err) {
    console.error('Unshare resume error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/resumes/public/:shareToken
 * Access resume via share token (public endpoint)
 */
export const getPublicResume = async (req: Request, res: Response) => {
  try {
    const { shareToken } = req.params;
    const resume = await Resume.findOne({ shareToken })
      .populate('template', 'name')
      .populate('user', 'name email');

    if (!resume) {
      return res.status(404).json({ message: 'Shared resume not found' });
    }

    // Check if share has expired
    if (resume.shareExpiresAt && new Date() > resume.shareExpiresAt) {
      return res.status(410).json({ message: 'Shared link has expired' });
    }

    // Return public resume data (without sensitive info)
    const publicResume = {
      id: resume._id,
      name: resume.data.name,
      title: resume.data.title,
      summary: resume.data.summary,
      template: (resume.template as any).name,
      createdAt: resume.createdAt,
      sharedBy: (resume.user as any).name,
    };

    res.json({ resume: publicResume });
  } catch (err) {
    console.error('Get public resume error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/resumes/public/:shareToken/download
 * Download resume PDF via share token (public endpoint)
 */
export const downloadPublicResume = async (req: Request, res: Response) => {
  try {
    const { shareToken } = req.params;
    const resume = await Resume.findOne({ shareToken }).populate('template');

    if (!resume) {
      return res.status(404).json({ message: 'Shared resume not found' });
    }

    // Check if share has expired
    if (resume.shareExpiresAt && new Date() > resume.shareExpiresAt) {
      return res.status(410).json({ message: 'Shared link has expired' });
    }

    const filename = `resume-${resume.data.name || 'shared'}.pdf`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/pdf');

    return streamResumePdf(resume, res, filename);
  } catch (err) {
    console.error('Download public resume error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

async function streamResumePdf(
  resume: IResume,
  res: Response,
  filename: string
) {
  const template = resume.template as { html?: string } | undefined;
  const html =
    template && typeof template === 'object' ? template.html : undefined;
  if (!html) {
    return res.status(404).json({ message: 'Template not found' });
  }

  const { filePath, regenerated } = await ensurePdfFile(
    resume.pdfUrl,
    html,
    resume.data
  );
  if (regenerated) {
    resume.pdfUrl = filePath;
    await resume.save();
  }

  return res.download(filePath, filename);
}
