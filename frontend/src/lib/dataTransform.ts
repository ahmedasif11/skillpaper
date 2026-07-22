// src/lib/dataTransform.ts
import { getTemplateConfig } from './templateConfig';

type SkillCategory = { category: string; items: string[] };

function isSkillCategory(skill: unknown): skill is SkillCategory {
  return (
    !!skill &&
    typeof skill === 'object' &&
    Array.isArray((skill as SkillCategory).items)
  );
}

function buildSkillCategories(
  skills: any[],
  hardSkillsList: any[],
  softSkillsList: any[],
  toolsList: any[]
): SkillCategory[] {
  const fromSkills = skills.filter(isSkillCategory).map((s) => ({
    category: s.category || 'Skills',
    items: s.items.map((item: any) =>
      typeof item === 'string' ? item : item.name || String(item)
    ),
  }));

  if (fromSkills.length > 0) {
    return fromSkills;
  }

  const categories: SkillCategory[] = [];
  const hard = hardSkillsList.map((s: any) => s.name || s).filter(Boolean);
  const soft = softSkillsList.map((s: any) => s.name || s).filter(Boolean);
  const tools = toolsList.map((s: any) => s.name || s).filter(Boolean);

  if (hard.length) categories.push({ category: 'Technical Skills', items: hard });
  if (soft.length) categories.push({ category: 'Soft Skills', items: soft });
  if (tools.length) categories.push({ category: 'Tools', items: tools });

  return categories;
}

function formatTechnologies(value: unknown): string {
  if (!value) return '';
  if (Array.isArray(value)) {
    return value
      .map((t) => (typeof t === 'string' ? t : (t as any)?.name || String(t)))
      .filter(Boolean)
      .join(', ');
  }
  return String(value);
}

function formatProjectsAsString(projects: any[]): string {
  return projects
    .map((proj) => {
      const name = proj.name || proj.title || '';
      const description = proj.description || '';
      if (name && description) return `${name}: ${description}`;
      return name || description;
    })
    .filter(Boolean)
    .join('; ');
}

/**
 * Transform resume data for a specific template
 * @param frontendData - Raw data from the resume form
 * @param templateName - Name of the template to transform data for
 */
export function transformResumeDataForTemplate(
  frontendData: any,
  templateName?: string
): any {
  const config = templateName ? getTemplateConfig(templateName) : null;

  const personalInfo = frontendData.personalInfo || {};
  const experience = frontendData.experience || [];
  const education = frontendData.education || [];
  const projects = frontendData.projects || [];
  const languages = frontendData.languages || [];
  const certifications = frontendData.certifications || [];
  const achievements = frontendData.achievements || [];
  const additionalInfo = frontendData.additionalInfo || [];
  const skills = frontendData.skills || [];
  const hardSkillsList = frontendData.hardSkillsList || [];
  const softSkillsList = frontendData.softSkillsList || [];
  const toolsList = frontendData.toolsList || [];

  const hardSkillsString = hardSkillsList
    .map((s: any) => s.name || s)
    .join(', ');
  const softSkillsString = softSkillsList
    .map((s: any) => s.name || s)
    .join(', ');
  const toolsString = toolsList.map((s: any) => s.name || s).join(', ');

  const skillCategories = buildSkillCategories(
    skills,
    hardSkillsList,
    softSkillsList,
    toolsList
  );

  // Flat skills string from non-category skill entries (legacy) or categories
  const skillsString =
    skills
      .map((skill: any) => {
        if (typeof skill === 'string') return skill;
        if (isSkillCategory(skill)) return skill.items.join(', ');
        return skill.name || '';
      })
      .filter(Boolean)
      .join(', ') ||
    skillCategories.map((c) => c.items.join(', ')).join(', ');

  const transformedExperience = experience.map((exp: any) => {
    const responsibilities = exp.responsibilities || exp.achievements || [];
    const expAchievements = exp.achievements || exp.responsibilities || [];
    return {
      company: exp.company || '',
      position: exp.position || '',
      location: exp.location || '',
      duration:
        exp.duration ||
        `${exp.startDate || ''} - ${exp.current ? 'Present' : exp.endDate || ''}`,
      description: exp.description || '',
      responsibilities,
      achievements: expAchievements,
      technologies: formatTechnologies(exp.technologies),
    };
  });

  const transformedEducation = education.map((edu: any) => ({
    degree: edu.degree || '',
    field: edu.field || '',
    institution: edu.institution || '',
    location: edu.location || '',
    year: edu.year || `${edu.startDate || ''} - ${edu.endDate || ''}`,
    gpa: edu.gpa || '',
    achievements: edu.achievements || [],
  }));

  const transformedProjects = projects.map((proj: any) => ({
    name: proj.name || proj.title || '',
    description: proj.description || '',
    url: proj.url || proj.link || '',
    github: proj.github || '',
    technologies: formatTechnologies(proj.technologies),
    startDate: proj.startDate || '',
    endDate: proj.endDate || '',
  }));

  const transformedLanguages = languages.map((lang: any) => {
    if (typeof lang === 'string') {
      return {
        language: lang.split(' (')[0] || lang,
        proficiency: lang.includes('(')
          ? lang.split(' (')[1]?.replace(')', '') || 'Intermediate'
          : 'Intermediate',
        certification: '',
      };
    }
    return {
      language: lang.language || '',
      proficiency: lang.proficiency || 'Intermediate',
      certification: lang.certification || '',
    };
  });

  const transformedCertifications = certifications.map((cert: any) => {
    if (typeof cert === 'string') {
      return {
        name: cert,
        issuer: '',
        date: '',
        credentialId: '',
        url: '',
      };
    }
    return {
      name: cert.name || cert,
      issuer: cert.issuer || '',
      date: cert.date || '',
      credentialId: cert.credentialId || '',
      url: cert.url || '',
    };
  });

  const languagesString = transformedLanguages
    .map(
      (lang: { language: string; proficiency: string }) =>
        `${lang.language} (${lang.proficiency})`
    )
    .join(', ');

  const certificationsString = transformedCertifications
    .map((cert: { name: string }) => cert.name)
    .join(', ');

  const projectsString = formatProjectsAsString(transformedProjects);

  const hasAnySkills = !!(
    hardSkillsString ||
    softSkillsString ||
    toolsString ||
    skillsString ||
    skillCategories.length
  );

  // skillsFormat: flat → boolean flag for {{#if skills}}; structured/hybrid → category array
  const skillsFormat = config?.skillsFormat ?? 'flat';
  const skillsValue =
    skillsFormat === 'structured' || skillsFormat === 'hybrid'
      ? skillCategories.length > 0
        ? skillCategories
        : undefined
      : hasAnySkills
        ? true
        : undefined;

  // certifications / projects: string for Jacqueline, arrays for ATS / Backend
  const certificationsFormat = config?.certificationsFormat ?? 'array';
  const projectsFormat = config?.projectsFormat ?? 'array';

  const transformedData: any = {
    name: personalInfo.name || personalInfo.fullName || '',
    title: personalInfo.title || '',
    tagline: personalInfo.tagline || '',
    email: personalInfo.email || '',
    phone: personalInfo.phone || '',
    location: personalInfo.location || '',
    website: personalInfo.website || '',
    linkedin: personalInfo.linkedin || '',
    github: personalInfo.github || '',
    summary: personalInfo.summary || '',

    technicalSkills: hardSkillsString || undefined,
    hardSkills: hardSkillsString || undefined,
    softSkills: softSkillsString || undefined,
    tools: toolsString || undefined,
    skills: skillsValue,

    languagesString: languagesString || undefined,
    languages: transformedLanguages,

    certificationsString: certificationsString || undefined,
    certifications:
      certificationsFormat === 'string'
        ? certificationsString || undefined
        : transformedCertifications,

    achievements,

    additionalInfo,

    experience: transformedExperience,
    education: transformedEducation,
    projects:
      projectsFormat === 'string'
        ? projectsString || undefined
        : transformedProjects,
  };

  if (config?.customTransform) {
    return config.customTransform(transformedData);
  }

  return transformedData;
}

export function transformResumeDataForBackend(frontendData: any): any {
  const personalInfo = frontendData.personalInfo || {};

  return {
    name: personalInfo.name || '',
    email: personalInfo.email || '',
    phone: personalInfo.phone || '',
    address: personalInfo.address || '',
    city: personalInfo.city || '',
    state: personalInfo.state || '',
    zipCode: personalInfo.zipCode || '',
    country: personalInfo.country || '',
    website: personalInfo.website || '',
    linkedin: personalInfo.linkedin || '',
    github: personalInfo.github || '',
    profilePic: personalInfo.profilePic || '',
    summary: personalInfo.summary || '',
    title: personalInfo.title || '',
    tagline: personalInfo.tagline || '',
    location: personalInfo.location || '',
    achievements: frontendData.achievements || [],
    technicalSkills: frontendData.technicalSkills || '',
    softSkills: frontendData.softSkills || '',
    certificationsString: frontendData.certificationsString || '',
    languagesString: frontendData.languagesString || '',
    tools: frontendData.tools || '',
    experience: frontendData.experience || [],
    education: frontendData.education || [],
    skills: frontendData.skills || [],
    projects: frontendData.projects || [],
    languages: frontendData.languages || [],
    references: frontendData.references || [],
    additionalSections: frontendData.additionalSections || [],
    additionalInfo: frontendData.additionalInfo || [],
  };
}
