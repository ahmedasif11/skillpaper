import mongoose, { Schema, Document, Model } from 'mongoose';
import type { ParsedResumeData } from '../types/parsedResume';

export type ParseStatus =
  | 'uploaded'
  | 'scanning'
  | 'parsing'
  | 'ready'
  | 'failed:scan'
  | 'failed:parse';

export type UploadedResumeMime =
  | 'application/pdf'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export interface IUploadedResume extends Document {
  user: mongoose.Types.ObjectId;
  label: string;
  filename: string;
  fileSize: number;
  mimeType: UploadedResumeMime;
  minioKey: string;
  fileHash: string | null;
  status: ParseStatus;
  parseError: string | null;
  parsedData: ParsedResumeData | null;
  confidenceScore: number | null;
  isOcrExtracted: boolean;
  parsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UploadedResumeSchema = new Schema<IUploadedResume>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    filename: {
      type: String,
      required: true,
      trim: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
      enum: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
    },
    minioKey: {
      type: String,
      required: true,
    },
    fileHash: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      required: true,
      enum: [
        'uploaded',
        'scanning',
        'parsing',
        'ready',
        'failed:scan',
        'failed:parse',
      ],
      default: 'uploaded',
    },
    parseError: {
      type: String,
      default: null,
    },
    parsedData: {
      type: Schema.Types.Mixed,
      default: null,
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    isOcrExtracted: {
      type: Boolean,
      default: false,
    },
    parsedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

UploadedResumeSchema.index({ user: 1, createdAt: -1 });
UploadedResumeSchema.index({ user: 1, status: 1 });
UploadedResumeSchema.index({ user: 1, fileHash: 1 });

const UploadedResume: Model<IUploadedResume> =
  mongoose.models.UploadedResume ||
  mongoose.model<IUploadedResume>('UploadedResume', UploadedResumeSchema);

export default UploadedResume;
