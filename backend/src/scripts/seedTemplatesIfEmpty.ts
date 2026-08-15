import Template from '../models/Template';
import { sampleTemplates } from '../data/sampleTemplates';

export async function seedTemplatesIfEmpty(): Promise<void> {
  const count = await Template.countDocuments();
  if (count > 0) return;

  for (const template of sampleTemplates) {
    await Template.findOneAndUpdate(
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
  }

  console.log(
    `Seeded ${sampleTemplates.length} template(s) into an empty database`
  );
}
