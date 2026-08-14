import {
  createResumeSchema,
  resumeDataSchema,
  updateResumeSchema,
} from '../validation/resume.validation';

const SHARED_DATA_KEYS = [
  'name',
  'email',
  'phone',
  'location',
  'website',
  'linkedin',
  'github',
  'summary',
  'title',
  'tagline',
  'experience',
  'education',
  'skills',
  'technicalSkills',
  'softSkills',
  'languagesString',
  'certificationsString',
  'tools',
  'additionalInfo',
  'achievements',
  'projects',
  'languages',
  'references',
  'additionalSections',
];

function dataKeys(schema: { describe: () => unknown }) {
  const described = schema.describe() as { keys?: Record<string, unknown> };
  return Object.keys(described.keys ?? {});
}

describe('BUG-01 / BUG-02 resume validation', () => {
  it('has a single top-level location and nested location only on experience/education', () => {
    const top = dataKeys(resumeDataSchema);
    expect(top.filter((key) => key === 'location')).toEqual(['location']);

    const described = resumeDataSchema.describe() as {
      keys: {
        experience: { items: Array<{ keys: Record<string, unknown> }> };
        education: { items: Array<{ keys: Record<string, unknown> }> };
        skills: { keys?: Record<string, unknown> };
      };
    };

    expect(described.keys.experience.items[0].keys).toHaveProperty('location');
    expect(described.keys.education.items[0].keys).toHaveProperty('location');
    expect(described.keys.skills.keys ?? {}).not.toHaveProperty('location');
  });

  it('keeps updateResumeSchema data keys in sync with create (skills, projects, languages, …)', () => {
    const createData = createResumeSchema.describe().keys.data as {
      keys: Record<string, unknown>;
    };
    const updateData = updateResumeSchema.describe().keys.data as {
      keys: Record<string, unknown>;
    };

    expect(Object.keys(createData.keys).sort()).toEqual(
      Object.keys(updateData.keys).sort()
    );
    expect(Object.keys(createData.keys)).toEqual(
      expect.arrayContaining(SHARED_DATA_KEYS)
    );
  });

  it('accepts full-form PUT data including sections that used to be omitted', () => {
    const { error, value } = updateResumeSchema.validate({
      data: {
        location: 'Karachi',
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
          {
            title: 'Volunteer',
            content: 'Community work that is long enough.',
          },
        ],
        achievements: ['Shipped the product'],
        experience: [
          {
            company: 'Acme',
            position: 'Engineer',
            duration: '2020-2024',
            location: 'Remote',
          },
        ],
        education: [
          {
            institution: 'NUST',
            degree: 'BS',
            year: '2018',
            location: 'Islamabad',
          },
        ],
      },
    });

    expect(error).toBeUndefined();
    expect(value.data.skills).toHaveLength(1);
    expect(value.data.projects).toHaveLength(1);
    expect(value.data.languages).toHaveLength(1);
    expect(value.data.references).toHaveLength(1);
    expect(value.data.additionalSections).toHaveLength(1);
    expect(value.data.achievements).toEqual(['Shipped the product']);
    expect(value.data.location).toBe('Karachi');
    expect(value.data.experience[0].location).toBe('Remote');
    expect(value.data.education[0].location).toBe('Islamabad');
  });
});
