'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Download, FileText, Pencil } from 'lucide-react';
import { UploadedResume } from '@/types';
import { ParseStatusBadge } from './ParseStatusBadge';
import { formatRelativeTime } from './format';
import { isTerminalParseStatus, useParseStatus } from '@/hooks/useParseStatus';

interface ResumeLibraryCardProps {
  resume: UploadedResume;
  variant?: 'dashboard' | 'select';
  onSelect?: (resume: UploadedResume) => void;
  onUseInForm?: (resume: UploadedResume) => void;
  onRename?: (resume: UploadedResume, label: string) => Promise<void> | void;
  onDownload?: (resume: UploadedResume) => Promise<void> | void;
  onDelete?: (resume: UploadedResume) => void;
  onRetry?: (resume: UploadedResume) => void;
  onStatusChange?: (id: string, status: UploadedResume['status']) => void;
}

export function ResumeLibraryCard({
  resume,
  variant = 'select',
  onSelect,
  onUseInForm,
  onRename,
  onDownload,
  onDelete,
  onRetry,
  onStatusChange,
}: ResumeLibraryCardProps) {
  const shouldPoll = !isTerminalParseStatus(resume.status);
  const { status, progressHint, estimatedSecondsRemaining } = useParseStatus(
    shouldPoll ? resume.id : null
  );
  const liveStatus = status || resume.status;
  const [isEditing, setIsEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(resume.label);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (status && status !== resume.status) {
      onStatusChange?.(resume.id, status);
    }
  }, [status, resume.id, resume.status, onStatusChange]);

  useEffect(() => {
    if (!isEditing) {
      setDraftLabel(resume.label);
    }
  }, [resume.label, isEditing]);

  const summary = resume.summary;
  const found =
    summary &&
    `Found: ${summary.skillsCount} skills · ${summary.experienceCount} jobs · ${summary.educationCount} education · ${summary.projectsCount} projects`;

  const startRename = () => {
    setDraftLabel(resume.label);
    setIsEditing(true);
  };

  const cancelRename = () => {
    setDraftLabel(resume.label);
    setIsEditing(false);
  };

  const saveRename = async (event?: FormEvent) => {
    event?.preventDefault();
    const next = draftLabel.trim();
    if (!next || next.length > 100) return;
    if (next === resume.label) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await onRename?.(resume, next);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await onDownload?.(resume);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex items-start gap-2">
            <FileText className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              {isEditing && onRename ? (
                <form className="space-y-2" onSubmit={saveRename}>
                  <Input
                    value={draftLabel}
                    onChange={(e) => setDraftLabel(e.target.value)}
                    maxLength={100}
                    aria-label="Resume label"
                    autoFocus
                    disabled={isSaving}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSaving || !draftLabel.trim()}
                    >
                      Save
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={cancelRename}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex items-start gap-1">
                  <p className="font-medium truncate">{resume.label}</p>
                  {onRename && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      aria-label="Rename resume"
                      onClick={startRename}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              )}
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
          {onDownload && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              <Download className="h-4 w-4" />
              Download
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
