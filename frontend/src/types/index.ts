// Template interfaces
export interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  isPro: boolean;
  html?: string; // Include HTML for preview
  isActive?: boolean;
}

// Resume data interfaces matching backend validation
export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  profilePic?: string;
  summary: string;
  title?: string;
  tagline?: string;
  location?: string;
}

export interface Education {
  institution: string;
  degree: string;
  field?: string;
  year: string;
  startYear?: number;
  endYear?: number;
  gpa?: number;
  location?: string;
  achievements?: string[];
}

export interface Experience {
  company: string;
  position: string;
  duration: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  location?: string;
  description?: string;
  responsibilities?: string[];
  achievements?: string[];
  technologies?: string[];
}

export interface Skill {
  id: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  category: 'hard' | 'soft' | 'tool';
}

export interface SkillCategory {
  category: string;
  items: string[];
  proficiency?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

export interface Project {
  name: string;
  description: string;
  technologies?: string[];
  url?: string;
  github?: string;
  startDate?: string;
  endDate?: string;
  achievements?: string[];
}

export interface Certification {
  name: string;
  issuer: string;
  date: string;
  expiryDate?: string;
  credentialId?: string;
  url?: string;
}

export interface Language {
  language: string;
  proficiency:
    | 'Beginner'
    | 'Elementary'
    | 'Intermediate'
    | 'Advanced'
    | 'Fluent'
    | 'Native';
  certification?: string;
}

export interface Reference {
  name: string;
  position: string;
  company: string;
  email: string;
  phone?: string;
  relationship?: string;
}

export interface AdditionalSection {
  title: string;
  content: string;
  type?: 'text' | 'list' | 'timeline';
}

// Additional interfaces for ATS template
export interface Achievement {
  description: string;
}

export interface SkillSet {
  hardSkills?: string;
  softSkills?: string;
  technicalSkills?: string; // Keep for backward compatibility
  certifications?: string;
  languages?: string;
  tools?: string;
}

// Complete resume data structure
export interface ResumeData {
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  profilePic?: string;
  summary: string;
  title?: string;
  tagline?: string;
  location?: string;
  achievements?: string[];
  hardSkills?: string;
  technicalSkills?: string; // Keep for backward compatibility
  softSkills?: string;
  certifications?: string;
  certificationsString?: string;
  languagesString?: string;
  tools?: string;
  experience?: Experience[];
  education?: Education[];
  skills?: SkillCategory[];
  hardSkillsList?: Skill[];
  softSkillsList?: Skill[];
  toolsList?: Skill[];
  projects?: Project[];
  certifications?: Certification[];
  languages?: Language[];
  references?: Reference[];
  additionalSections?: AdditionalSection[];
  additionalInfo?: string[];
}

// Resume document interface
export interface Resume {
  _id: string;
  user: string;
  template: string | Template;
  data: ResumeData;
  pdfUrl?: string;
  isPublic?: boolean;
  shareToken?: string;
  shareExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

// API response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ShareResponse {
  message: string;
  shareUrl: string;
  expiresAt: string;
  shareToken: string;
}

export interface PreviewResponse {
  pdf: string;
  filename: string;
}

export type FormStep =
  | 'personal'
  | 'education'
  | 'experience'
  | 'skills'
  | 'projects'
  | 'extras';

export type Page =
  | 'home'
  | 'templates'
  | 'template-details'
  | 'resume-form'
  | 'preview'
  | 'dashboard'
  | 'login';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

export type ParseStatus =
  | 'uploaded'
  | 'scanning'
  | 'parsing'
  | 'ready'
  | 'failed:scan'
  | 'failed:parse';

export interface UploadedResumeSummary {
  skillsCount: number;
  experienceCount: number;
  educationCount: number;
  projectsCount: number;
}

export interface UploadedResume {
  id: string;
  label: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  status: ParseStatus;
  parseError: string | null;
  confidenceScore: number | null;
  isOcrExtracted: boolean;
  summary?: UploadedResumeSummary;
  parsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

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
  proficiency?: string;
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

export interface UploadedResumeWithData extends UploadedResume {
  parsedData: ParsedResumeData | null;
}

export interface UploadedResumeStatus {
  id: string;
  status: ParseStatus;
  progressHint: string;
  estimatedSecondsRemaining?: number;
}

export interface UploadedResumeParsedPayload {
  parsedData: ParsedResumeData;
  confidenceScore: number | null;
  isOcrExtracted: boolean;
  parsedAt: string | null;
}
