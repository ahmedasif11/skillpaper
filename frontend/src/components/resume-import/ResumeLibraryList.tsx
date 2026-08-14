'use client';

import { UploadedResume } from '@/types';
import { ResumeLibraryCard } from './ResumeLibraryCard';

interface ResumeLibraryListProps {
  resumes: UploadedResume[];
  variant?: 'dashboard' | 'select';
  onSelect?: (resume: UploadedResume) => void;
  onUseInForm?: (resume: UploadedResume) => void;
  onDelete?: (resume: UploadedResume) => void;
  onRetry?: (resume: UploadedResume) => void;
  onStatusChange?: (id: string, status: UploadedResume['status']) => void;
}

export function ResumeLibraryList({
  resumes,
  variant = 'select',
  onSelect,
  onUseInForm,
  onDelete,
  onRetry,
  onStatusChange,
}: ResumeLibraryListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {resumes.map((resume) => (
        <ResumeLibraryCard
          key={resume.id}
          resume={resume}
          variant={variant}
          onSelect={onSelect}
          onUseInForm={onUseInForm}
          onDelete={onDelete}
          onRetry={onRetry}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
}
