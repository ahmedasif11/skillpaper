import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import Template from '../models/Template';
import { sampleTemplates } from '../data/sampleTemplates';

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://localhost:27017/skillpaper';

async function seedDatabase() {
  await mongoose.connect(MONGO_URI);
  console.log('MongoDB connected');

  for (const template of sampleTemplates) {
    const saved = await Template.findOneAndUpdate(
      { name: template.name },
      {
        $set: {
          name: template.name,
          preview: template.preview,
          html: template.html,
          isActive: true,
        },
      },
      { upsert: true, new: true }
    );
    console.log(`Seeded template: ${saved.name}`);
  }

  console.log(`Done. ${sampleTemplates.length} template(s) available.`);
  await mongoose.disconnect();
}

seedDatabase().catch((err) => {
  console.error('Seed failed', err);
  process.exit(1);
});
