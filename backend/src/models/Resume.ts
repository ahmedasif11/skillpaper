// src/models/Resume.ts
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IResume extends Document {
  user: mongoose.Schema.Types.ObjectId;
  template: mongoose.Schema.Types.ObjectId;
  data: any;
  pdfUrl?: string;
  isPublic?: boolean;
  shareToken?: string;
  shareExpiresAt?: Date;
  sourceUploadedResumeId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const ResumeSchema: Schema<IResume> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    template: { type: Schema.Types.ObjectId, ref: 'Template', required: true },
    data: { type: Schema.Types.Mixed, required: true },
    pdfUrl: { type: String },
    isPublic: { type: Boolean, default: false },
    shareToken: { type: String, unique: true, sparse: true },
    shareExpiresAt: { type: Date },
    sourceUploadedResumeId: {
      type: Schema.Types.ObjectId,
      ref: 'UploadedResume',
      default: null,
    },
  },
  { timestamps: true }
);

ResumeSchema.index({ sourceUploadedResumeId: 1 });

const Resume: Model<IResume> =
  mongoose.models.Resume || mongoose.model<IResume>('Resume', ResumeSchema);
export default Resume;
