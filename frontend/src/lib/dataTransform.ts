// src/lib/dataTransform.ts
import { ResumeData } from '@/types';
import { getTemplateConfig, TemplateConfig } from './templateConfig';

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

  // Create skills strings from skill lists
  const hardSkillsString = hardSkillsList
    .map((s: any) => s.name || s)
    .join(', ');
  const softSkillsString = softSkillsList
    .map((s: any) => s.name || s)
    .join(', ');
  const toolsString = toolsList.map((s: any) => s.name || s).join(', ');

  // Transform experience data
  const transformedExperience = experience.map((exp: any) => ({
    company: exp.company || '',
    position: exp.position || '',
    location: exp.location || '',
    duration:
      exp.duration ||
      `${exp.startDate || ''} - ${exp.current ? 'Present' : exp.endDate || ''}`,
    responsibilities: exp.responsibilities || exp.achievements || [],
  }));

  // Transform education data
  const transformedEducation = education.map((edu: any) => ({
    degree: edu.degree || '',
    institution: edu.institution || '',
    location: edu.location || '',
    year: edu.year || `${edu.startDate || ''} - ${edu.endDate || ''}`,
    achievements: edu.achievements || [],
  }));

  // Transform projects data
  const transformedProjects = projects.map((proj: any) => ({
    name: proj.name || proj.title || '',
    description: proj.description || '',
    url: proj.url || proj.github || proj.link || '',
  }));

  // Transform languages data
  const transformedLanguages = languages.map((lang: any) => {
    if (typeof lang === 'string') {
      return {
        language: lang.split(' (')[0] || lang,
        proficiency: lang.includes('(')
          ? lang.split(' (')[1]?.replace(')', '') || 'Intermediate'
          : 'Intermediate',
      };
    }
    return {
      language: lang.language || '',
      proficiency: lang.proficiency || 'Intermediate',
    };
  });

  // Transform certifications data
  const transformedCertifications = certifications.map((cert: any) => {
    if (typeof cert === 'string') {
      return {
        name: cert,
        issuer: '',
        date: '',
      };
    }
    return {
      name: cert.name || cert,
      issuer: cert.issuer || '',
      date: cert.date || '',
    };
  });

  // Create languages string for ATS template
  const languagesString = transformedLanguages
    .map((lang) => `${lang.language} (${lang.proficiency})`)
    .join(', ');

  // Create certifications string for ATS template
  const certificationsString = transformedCertifications
    .map((cert) => cert.name)
    .join(', ');

  // Create skills string from skills array
  const skillsString = skills
    .map((skill: any) => {
      if (typeof skill === 'string') return skill;
      return skill.name || skill;
    })
    .join(', ');

  // Determine if we need to provide a 'skills' conditional flag
  // This is used by templates to check {{#if skills}}
  const hasAnySkills = !!(
    hardSkillsString ||
    softSkillsString ||
    toolsString ||
    skillsString
  );

  // Base transformation with all possible fields
  const transformedData: any = {
    // Personal info
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

    // Skills - provide both flat strings and structured arrays
    technicalSkills: hardSkillsString, // For templates that use technicalSkills
    hardSkills: hardSkillsString,
    softSkills: softSkillsString,
    tools: toolsString,
    skills: hasAnySkills ? true : undefined, // Conditional flag for templates

    // Languages
    languagesString: languagesString, // For templates that use flat string
    languages: transformedLanguages, // For templates that use structured array

    // Certifications
    certificationsString: certificationsString, // For templates that use flat string
    certifications: transformedCertifications, // For templates that use structured array

    // Achievements
    achievements: achievements,

    // Additional info
    additionalInfo: additionalInfo,

    // Structured data
    experience: transformedExperience,
    education: transformedEducation,
    projects: transformedProjects,
  };

  // Apply custom transformation if template config has one
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
