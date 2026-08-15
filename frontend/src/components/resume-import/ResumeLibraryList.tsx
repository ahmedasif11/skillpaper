'use client';

import { UploadedResume } from '@/types';
import { ResumeLibraryCard } from './ResumeLibraryCard';

interface ResumeLibraryListProps {
  resumes: UploadedResume[];
  variant?: 'dashboard' | 'select';
  onSelect?: (resume: UploadedResume) => void;
  onUseInForm?: (resume: UploadedResume) => void;
  onRename?: (resume: UploadedResume, label: string) => Promise<void> | void;
  onDownload?: (resume: UploadedResume) => Promise<void> | void;
  onDelete?: (resume: UploadedResume) => void;
  onRetry?: (resume: UploadedResume) => void;
  onStatusChange?: (id: string, status: UploadedResume['status']) => void;
}

export function ResumeLibraryList({
  resumes,
  variant = 'select',
  onSelect,
  onUseInForm,
  onRename,
  onDownload,
  onDelete,
  onRetry,
  onStatusChange,
}: ResumeLibraryListProps) {
  const gridClass =
    variant === 'dashboard'
      ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
      : 'grid grid-cols-1 gap-4';

  return (
    <div className={gridClass}>
      {resumes.map((resume) => (
        <ResumeLibraryCard
          key={resume.id}
          resume={resume}
          variant={variant}
          onSelect={onSelect}
          onUseInForm={onUseInForm}
          onRename={onRename}
          onDownload={onDownload}
          onDelete={onDelete}
          onRetry={onRetry}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
}
