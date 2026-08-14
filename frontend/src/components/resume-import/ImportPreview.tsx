'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft, Check } from 'lucide-react';
import { ParsedResumeData, UploadedResume } from '@/types';
import { confidenceLabel } from './format';

interface ImportPreviewProps {
  resume: UploadedResume;
  parsedData: ParsedResumeData;
  confidenceScore?: number | null;
  onBack: () => void;
  onApply: () => void;
}

export function ImportPreview({
  resume,
  parsedData,
  confidenceScore,
  onBack,
  onApply,
}: ImportPreviewProps) {
  const skills = parsedData.skills || [];
  const experience = parsedData.experience || [];
  const education = parsedData.education || [];
  const projects = parsedData.projects || [];
  const certifications = parsedData.certifications || [];
  const score = confidenceScore ?? resume.confidenceScore;
  const width = Math.max(0, Math.min(100, score ?? 0));

  const rows = [
    {
      ok: !!(parsedData.name || parsedData.email),
      label: 'Personal Info',
      detail: [parsedData.name, parsedData.email].filter(Boolean).join(' · ') || 'Missing',
    },
    {
      ok: experience.length > 0,
      label: 'Experience',
      detail: experience.length
        ? `${experience.length} job${experience.length === 1 ? '' : 's'}${
            experience[0]?.company ? ` (${experience.map((e) => e.company).filter(Boolean).slice(0, 3).join(', ')})` : ''
          }`
        : 'No jobs found',
    },
    {
      ok: education.length > 0,
      label: 'Education',
      detail: education[0]
        ? [education[0].degree, education[0].institution, education[0].graduationYear]
            .filter(Boolean)
            .join(', ')
        : 'No education found',
    },
    {
      ok: skills.length > 0,
      label: 'Skills',
      detail: skills.length
        ? `${skills.slice(0, 3).join(', ')}${skills.length > 3 ? ` (+${skills.length - 3} more)` : ''}`
        : 'No skills found',
    },
    {
      ok: projects.length > 0,
      label: 'Projects',
      detail: projects.length
        ? `${projects.length} project${projects.length === 1 ? '' : 's'}`
        : 'No projects found',
    },
    {
      ok: certifications.length > 0,
      label: 'Extras',
      detail: certifications.length
        ? `${certifications.length} certification${certifications.length === 1 ? '' : 's'}`
        : 'No certifications found',
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h2 className="text-lg font-semibold">Confirm Import</h2>
      </div>

      <p className="text-sm text-muted-foreground">From: “{resume.label}”</p>

      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.label} className="flex gap-2 text-sm">
            {row.ok ? (
              <Check className="h-4 w-4 mt-0.5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
            )}
            <span className="font-medium w-28 shrink-0">{row.label}</span>
            <span className="text-muted-foreground min-w-0">{row.detail}</span>
          </li>
        ))}
      </ul>

      <div>
        <p className="text-sm mb-1">
          Confidence: {score ?? '—'}%{score != null ? ` — ${confidenceLabel(score)}` : ''}
        </p>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary"
            style={{ width: `${width}%` }}
          />
        </div>
      </div>

      <p className="text-sm text-amber-700 dark:text-amber-400">
        This will replace any data you&apos;ve already entered.
      </p>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onBack}>
          Cancel
        </Button>
        <Button onClick={onApply}>Apply to Form →</Button>
      </div>
    </div>
  );
}
