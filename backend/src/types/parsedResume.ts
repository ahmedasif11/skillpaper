export interface ParsedResumeLink {
  label?: string;
  url: string;
}

export interface ParsedResumeEducation {
  institution: string;
  degree: string;
  field?: string;
  graduationYear?: string;
  gpa?: string;
  description?: string;
}

export interface ParsedResumeExperience {
  company: string;
  title: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  responsibilities?: string[];
  description?: string;
}

export interface ParsedResumeProject {
  name: string;
  description: string;
  technologies?: string[];
  url?: string;
  date?: string;
}

export interface ParsedResumeCertification {
  name: string;
  issuer?: string;
  date?: string;
  url?: string;
}

export interface ParsedResumeLanguage {
  name: string;
  proficiency?: 'Native' | 'Fluent' | 'Professional' | 'Conversational' | 'Basic';
}

export interface ParsedResumeAchievement {
  title: string;
  description?: string;
  date?: string;
}

export interface ParsedResumeData {
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  links?: ParsedResumeLink[];
  education?: ParsedResumeEducation[];
  experience?: ParsedResumeExperience[];
  skills?: string[];
  softSkills?: string[];
  tools?: string[];
  projects?: ParsedResumeProject[];
  certifications?: ParsedResumeCertification[];
  languages?: ParsedResumeLanguage[];
  achievements?: ParsedResumeAchievement[];
}
