// src/models/Template.ts
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ITemplate extends Document {
  name: string;
  description?: string;
  category?: string;
  preview?: string;
  html: string;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TemplateSchema: Schema<ITemplate> = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: 'Professional resume template' },
    category: { type: String, default: 'Professional' },
    preview: { type: String },
    html: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Template: Model<ITemplate> =
  mongoose.models.Template ||
  mongoose.model<ITemplate>('Template', TemplateSchema);
export default Template;
