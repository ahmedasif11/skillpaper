import { Skill } from '@/types';

const emptyPersonal = {
  name: '',
  email: '',
  phone: '',
  location: '',
  summary: '',
  title: '',
  tagline: '',
  website: '',
  linkedin: '',
  github: '',
};

export function createEmptyResumeFormData() {
  return {
    personalInfo: { ...emptyPersonal },
    education: [] as any[],
    experience: [] as any[],
    skills: [] as any[],
    projects: [] as any[],
    languages: [] as any[],
    certifications: [] as any[],
    achievements: [] as any[],
    hardSkillsList: [] as Skill[],
    softSkillsList: [] as Skill[],
    toolsList: [] as Skill[],
    technicalSkills: '',
    softSkills: '',
    tools: '',
    additionalInfo: [] as string[],
  };
}

function toSkillList(
  value: unknown,
  category: Skill['category']
): Skill[] {
  if (Array.isArray(value)) {
    return value
      .map((item, index) => {
        if (typeof item === 'string') {
          return {
            id: `${category}-${index}`,
            name: item,
            level: 'Intermediate' as const,
            category,
          };
        }
        if (item && typeof item === 'object') {
          return {
            id: (item as Skill).id || `${category}-${index}`,
            name: (item as Skill).name || String((item as any).items || ''),
            level: (item as Skill).level || 'Intermediate',
            category,
          };
        }
        return null;
      })
      .filter(Boolean) as Skill[];
  }

  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((name, index) => ({
      id: `${category}-${index}`,
      name: name.trim(),
      level: 'Intermediate' as const,
      category,
    }));
  }

  return [];
}

function toStringList(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          return (
            (item as any).language ||
            (item as any).name ||
            (item as any).description ||
            ''
          );
        }
        return String(item);
      })
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function withIds<T extends Record<string, unknown>>(
  items: T[],
  prefix: string
): T[] {
  return items.map((item, index) => ({
    ...item,
    id: (item as any).id || `${prefix}-${index}`,
  }));
}

export function hydrateFormFromStoredData(raw: any) {
  const base = createEmptyResumeFormData();
  if (!raw || typeof raw !== 'object') return base;

  const personalInfo = raw.personalInfo
    ? { ...emptyPersonal, ...raw.personalInfo }
    : {
        ...emptyPersonal,
        name: raw.name || '',
        email: raw.email || '',
        phone: raw.phone || '',
        location: raw.location || '',
        summary: raw.summary || '',
        title: raw.title || '',
        tagline: raw.tagline || '',
        website: raw.website || '',
        linkedin: raw.linkedin || '',
        github: raw.github || '',
      };

  const education = withIds(
    (raw.education || []).map((edu: any) => ({
      ...edu,
      startDate: edu.startDate || edu.startYear || '',
      endDate: edu.endDate || edu.endYear || edu.year || '',
      field: edu.field || '',
    })),
    'edu'
  );

  const experience = withIds(
    (raw.experience || []).map((exp: any) => ({
      ...exp,
      startDate: exp.startDate || '',
      endDate: exp.endDate || '',
      responsibilities: exp.responsibilities || exp.achievements || [],
    })),
    'exp'
  );

  const projects = withIds(
    (raw.projects || []).map((proj: any, index: number) => ({
      ...proj,
      id: proj.id || `proj-${index}`,
      title: proj.title || proj.name || '',
      name: proj.name || proj.title || '',
      technologies: Array.isArray(proj.technologies)
        ? proj.technologies.map((t: any) =>
            typeof t === 'string' ? t : t?.name || String(t)
          )
        : typeof proj.technologies === 'string'
          ? proj.technologies.split(',').map((t: string) => t.trim())
          : [],
      link: proj.link || proj.url || '',
    })),
    'proj'
  );

  return {
    ...base,
    ...raw,
    personalInfo,
    education,
    experience,
    projects,
    hardSkillsList: toSkillList(
      raw.hardSkillsList || raw.hardSkills || raw.technicalSkills,
      'hard'
    ),
    softSkillsList: toSkillList(raw.softSkillsList || raw.softSkills, 'soft'),
    toolsList: toSkillList(raw.toolsList || raw.tools, 'tool'),
    languages: toStringList(raw.languages || raw.languagesString),
    certifications: toStringList(
      raw.certifications || raw.certificationsString
    ),
    achievements: toStringList(raw.achievements),
    additionalInfo: toStringList(raw.additionalInfo),
    templateId: raw.templateId,
    templateName: raw.templateName,
  };
}

export function getTemplateIdFromResume(resume: any): string | null {
  if (!resume) return null;
  const template = resume.template;
  if (!template) return null;
  if (typeof template === 'string') return template;
  return template._id || template.id || null;
}

export function isPersistedResumeId(id: string | null | undefined): boolean {
  return !!id && /^[a-f0-9]{24}$/i.test(id);
}
