// src/controllers/template.controller.ts
import { Request, Response } from 'express';
import Template from '../models/Template';

/**
 * GET /api/templates
 */
export const listTemplates = async (_req: Request, res: Response) => {
  try {
    const templates = await Template.find().sort({ createdAt: -1 });
    res.json({ templates });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/templates/:id
 */
export const getTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = await Template.findById(id);
    if (!template)
      return res.status(404).json({ message: 'Template not found' });
    res.json({ template });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/templates
 * (Admin or protected in your app — currently open)
 */
export const createTemplate = async (req: Request, res: Response) => {
  try {
    const { name, description, category, preview, html, isActive } = req.body;
    const template = new Template({
      name,
      description,
      category,
      preview,
      html,
      isActive: isActive !== undefined ? isActive : true,
    });
    await template.save();
    res.status(201).json({ template });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
