// Template Configuration System
// Defines what data fields each template expects and how to transform data for each template

export interface TemplateConfig {
  id?: string; // Template ID from backend
  name: string;
  requiredFields: string[];
  optionalFields: string[];
  skillsFormat: 'flat' | 'structured' | 'hybrid'; // flat = technicalSkills/softSkills as strings, structured = array of skill objects, hybrid = both
  languagesFormat: 'string' | 'array'; // string = "English (Native), Spanish (Fluent)", array = [{language, proficiency}]
  certificationsFormat: 'string' | 'array'; // string = comma-separated, array = [{name, issuer, date}]
  projectsFormat: 'string' | 'array'; // string = text description, array = [{name, description, url}]
  customTransform?: (data: any) => any; // Custom transformation function for special cases
}

export const templateConfigs: Record<string, TemplateConfig> = {
  'jacqueline-thompson': {
    name: 'Jacqueline Thompson Professional',
    requiredFields: ['name', 'email', 'phone', 'location'],
    optionalFields: [
      'website',
      'summary',
      'experience',
      'education',
      'softSkills',
      'technicalSkills',
      'certifications',
      'languagesString',
      'additionalInfo',
    ],
    skillsFormat: 'flat', // Uses softSkills and technicalSkills as strings
    languagesFormat: 'string', // Uses languagesString
    certificationsFormat: 'string', // Uses certifications as string
    projectsFormat: 'string', // Uses projects as string
  },
  'ats-friendly': {
    name: 'ATS-Friendly Professional',
    requiredFields: ['name', 'email', 'phone'],
    optionalFields: [
      'title',
      'tagline',
      'location',
      'website',
      'linkedin',
      'summary',
      'achievements',
      'technicalSkills',
      'softSkills',
      'languagesString',
      'tools',
      'experience',
      'education',
      'certifications',
      'projects',
      'languages',
      'additionalInfo',
    ],
    skillsFormat: 'flat', // Uses technicalSkills, softSkills, tools as strings
    languagesFormat: 'array', // Uses languages array with {language, proficiency}
    certificationsFormat: 'array', // Uses certifications array with {name, issuer, date}
    projectsFormat: 'array', // Uses projects array with {name, description, url}
  },
  'backend-developer': {
    name: 'Professional Backend Developer',
    requiredFields: ['name', 'email', 'phone', 'title'],
    optionalFields: [
      'location',
      'website',
      'linkedin',
      'github',
      'summary',
      'experience',
      'education',
      'skills',
      'technicalSkills',
      'softSkills',
      'projects',
      'certifications',
      'languages',
    ],
    skillsFormat: 'hybrid', // Can use both structured skills array AND flat technicalSkills/softSkills
    languagesFormat: 'array', // Uses languages array with {language, proficiency, certification}
    certificationsFormat: 'array', // Uses certifications array with {name, issuer, date, credentialId, url}
    projectsFormat: 'array', // Uses projects array with {name, description, technologies, url, github, startDate, endDate}
  },
};

// Map backend template names to config keys
export function getTemplateConfigKey(templateName: string): string {
  const normalizedName = templateName.toLowerCase();

  if (
    normalizedName.includes('jacqueline') ||
    normalizedName.includes('thompson')
  ) {
    return 'jacqueline-thompson';
  } else if (
    normalizedName.includes('ats') ||
    normalizedName.includes('friendly')
  ) {
    return 'ats-friendly';
  } else if (
    normalizedName.includes('backend') ||
    normalizedName.includes('developer')
  ) {
    return 'backend-developer';
  }

  // Default to ATS-friendly as it's the most flexible
  return 'ats-friendly';
}

export function getTemplateConfig(templateNameOrId: string): TemplateConfig {
  const configKey = getTemplateConfigKey(templateNameOrId);
  return templateConfigs[configKey] || templateConfigs['ats-friendly'];
}

// Helper function to check if a template supports a specific field
export function templateSupportsField(
  templateName: string,
  fieldName: string
): boolean {
  const config = getTemplateConfig(templateName);
  return (
    config.requiredFields.includes(fieldName) ||
    config.optionalFields.includes(fieldName)
  );
}

// Helper function to get required fields for a template
export function getRequiredFields(templateName: string): string[] {
  const config = getTemplateConfig(templateName);
  return config.requiredFields;
}

// Helper function to get all supported fields for a template
export function getAllSupportedFields(templateName: string): string[] {
  const config = getTemplateConfig(templateName);
  return [...config.requiredFields, ...config.optionalFields];
}
