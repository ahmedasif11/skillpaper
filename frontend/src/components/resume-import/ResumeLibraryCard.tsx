'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { UploadedResume } from '@/types';
import { ParseStatusBadge } from './ParseStatusBadge';
import { formatRelativeTime } from './format';
import { isTerminalParseStatus, useParseStatus } from '@/hooks/useParseStatus';

interface ResumeLibraryCardProps {
  resume: UploadedResume;
  variant?: 'dashboard' | 'select';
  onSelect?: (resume: UploadedResume) => void;
  onUseInForm?: (resume: UploadedResume) => void;
  onDelete?: (resume: UploadedResume) => void;
  onRetry?: (resume: UploadedResume) => void;
  onStatusChange?: (id: string, status: UploadedResume['status']) => void;
}

export function ResumeLibraryCard({
  resume,
  variant = 'select',
  onSelect,
  onUseInForm,
  onDelete,
  onRetry,
  onStatusChange,
}: ResumeLibraryCardProps) {
  const shouldPoll = !isTerminalParseStatus(resume.status);
  const { status, progressHint, estimatedSecondsRemaining } = useParseStatus(
    shouldPoll ? resume.id : null
  );
  const liveStatus = status || resume.status;

  useEffect(() => {
    if (status && status !== resume.status) {
      onStatusChange?.(resume.id, status);
    }
  }, [status, resume.id, resume.status, onStatusChange]);

  const summary = resume.summary;
  const found =
    summary &&
    `Found: ${summary.skillsCount} skills · ${summary.experienceCount} jobs · ${summary.educationCount} education · ${summary.projectsCount} projects`;

  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex items-start gap-2">
            <FileText className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="font-medium truncate">{resume.label}</p>
              <p className="text-sm text-muted-foreground">
                Uploaded {formatRelativeTime(resume.createdAt)}
              </p>
            </div>
          </div>
          <ParseStatusBadge status={liveStatus} />
        </div>

        {liveStatus === 'ready' && found && (
          <p className="text-sm text-muted-foreground">{found}</p>
        )}
        {shouldPoll && (
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {progressHint}
            {estimatedSecondsRemaining
              ? ` · Est. ~${estimatedSecondsRemaining}s remaining`
              : ''}
          </p>
        )}
        {liveStatus === 'failed:parse' && resume.parseError && (
          <p className="text-sm text-destructive">{resume.parseError}</p>
        )}

        <div className="flex flex-wrap gap-2">
          {variant === 'select' && liveStatus === 'ready' && (
            <Button size="sm" onClick={() => onSelect?.(resume)}>
              Select
            </Button>
          )}
          {variant === 'dashboard' && liveStatus === 'ready' && (
            <Button size="sm" onClick={() => onUseInForm?.(resume)}>
              Use in Form
            </Button>
          )}
          {liveStatus === 'failed:parse' && (
            <Button size="sm" variant="outline" onClick={() => onRetry?.(resume)}>
              Retry Parse
            </Button>
          )}
          {(liveStatus === 'uploaded' ||
            liveStatus === 'scanning' ||
            liveStatus === 'parsing') && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete?.(resume)}
            >
              Cancel
            </Button>
          )}
          {(liveStatus === 'ready' ||
            liveStatus === 'failed:parse' ||
            liveStatus === 'failed:scan') && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete?.(resume)}
            >
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
