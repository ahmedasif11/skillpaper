import { ParsedResumeData, ParsedResumeLink } from '@/types';
import { hydrateFormFromStoredData } from '@/lib/hydrateResumeForm';

function mapLinks(links?: ParsedResumeLink[]) {
  const result = { website: '', linkedin: '', github: '' };
  for (const link of links || []) {
    const url = link.url || '';
    const label = (link.label || '').toLowerCase();
    const haystack = `${label} ${url.toLowerCase()}`;
    if (haystack.includes('linkedin')) {
      result.linkedin = url;
    } else if (haystack.includes('github')) {
      result.github = url;
    } else if (!result.website) {
      result.website = url;
    }
  }
  return result;
}

function unwrapParsedResume(raw: ParsedResumeData | Record<string, unknown>) {
  if (!raw || typeof raw !== 'object') {
    return {} as ParsedResumeData;
  }
  const rec = raw as Record<string, unknown>;
  if (rec.parsedData && typeof rec.parsedData === 'object') {
    return rec.parsedData as ParsedResumeData;
  }
  if (
    rec.data &&
    typeof rec.data === 'object' &&
    (rec.data as Record<string, unknown>).parsedData &&
    typeof (rec.data as Record<string, unknown>).parsedData === 'object'
  ) {
    return (rec.data as Record<string, unknown>).parsedData as ParsedResumeData;
  }
  return raw as ParsedResumeData;
}

export function hydrateFormFromParsedResume(
  parsedData: ParsedResumeData | Record<string, unknown>
) {
  const src = unwrapParsedResume(parsedData);
  const links = mapLinks(src.links);
  const firstTitle = src.experience?.[0]?.title ?? '';

  return hydrateFormFromStoredData({
    personalInfo: {
      name: src.name ?? '',
      email: src.email ?? '',
      phone: src.phone ?? '',
      location: src.location ?? '',
      summary: src.summary ?? '',
      title: firstTitle,
      website: links.website,
      linkedin: links.linkedin,
      github: links.github,
    },
    education: (src.education || []).map((edu) => ({
      institution: edu.institution ?? '',
      degree: edu.degree ?? '',
      field: edu.field ?? '',
      year: edu.graduationYear ?? '',
      endDate: edu.graduationYear ?? '',
      gpa: edu.gpa ?? '',
      description: edu.description ?? '',
    })),
    experience: (src.experience || []).map((exp) => {
      const end = exp.endDate || 'Present';
      const current = !exp.endDate || /present/i.test(exp.endDate);
      return {
        company: exp.company ?? '',
        position: exp.title ?? '',
        title: exp.title ?? '',
        startDate: exp.startDate ?? '',
        endDate: current ? '' : end,
        current,
        duration: `${exp.startDate || ''} – ${end}`.trim(),
        location: exp.location ?? '',
        responsibilities: exp.responsibilities ?? [],
        description:
          exp.description ||
          (exp.responsibilities || []).join('\n') ||
          '',
      };
    }),
    hardSkills: src.skills ?? [],
    hardSkillsList: src.skills ?? [],
    softSkills: src.softSkills ?? [],
    tools: src.tools ?? [],
    projects: (src.projects || []).map((proj) => ({
      name: proj.name ?? '',
      title: proj.name ?? '',
      description: proj.description ?? '',
      technologies: proj.technologies ?? [],
      url: proj.url ?? '',
      link: proj.url ?? '',
    })),
    languages: (src.languages || []).map((lang) =>
      lang.proficiency ? `${lang.name} (${lang.proficiency})` : lang.name
    ),
    certifications: (src.certifications || []).map((cert) =>
      cert.issuer ? `${cert.name} — ${cert.issuer}` : cert.name
    ),
    achievements: (src.achievements || []).map(
      (item) => item.title || item.description || ''
    ),
  });
}
