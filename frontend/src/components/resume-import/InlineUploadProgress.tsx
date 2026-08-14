'use client';

import { Button } from '@/components/ui/button';
import { ParseStatus } from '@/types';
import { formatFileSize } from './format';
import { Bot, CheckCircle2, Shield } from 'lucide-react';

interface InlineUploadProgressProps {
  filename: string;
  fileSize?: number;
  uploadPercent?: number;
  status: ParseStatus | 'uploading';
  progressHint?: string;
  estimatedSecondsRemaining?: number;
  isTimedOut?: boolean;
  error?: string | null;
  skillsCount?: number;
  experienceCount?: number;
  educationCount?: number;
  confidenceScore?: number | null;
  onCancel?: () => void;
  onRefresh?: () => void;
  onApply?: () => void;
}

export function InlineUploadProgress({
  filename,
  fileSize,
  uploadPercent = 0,
  status,
  progressHint,
  estimatedSecondsRemaining,
  isTimedOut,
  error,
  skillsCount,
  experienceCount,
  educationCount,
  confidenceScore,
  onCancel,
  onRefresh,
  onApply,
}: InlineUploadProgressProps) {
  if (status === 'uploading') {
    return (
      <div className="space-y-4" aria-live="polite">
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            ← Cancel Upload
          </Button>
        )}
        <p className="font-medium">
          {filename}
          {fileSize ? ` · ${formatFileSize(fileSize)}` : ''}
        </p>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${uploadPercent}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground">Uploading... {uploadPercent}%</p>
      </div>
    );
  }

  if (status === 'scanning' || status === 'uploaded') {
    return (
      <div className="space-y-3 py-4" aria-live="polite">
        <div className="flex items-center gap-2 font-medium">
          <Shield className="h-5 w-5" />
          {status === 'uploaded' ? 'Queued...' : 'Scanning for safety...'}
        </div>
        <p className="text-sm text-muted-foreground">
          {progressHint || 'This usually takes a few seconds.'}
        </p>
      </div>
    );
  }

  if (status === 'parsing') {
    return (
      <div className="space-y-3 py-4" aria-live="polite">
        <div className="flex items-center gap-2 font-medium">
          <Bot className="h-5 w-5" />
          AI is reading your resume...
        </div>
        <p className="text-sm text-muted-foreground">
          Extracting skills, experience, and education.
          {estimatedSecondsRemaining ? ` ~${estimatedSecondsRemaining}s` : ''}
        </p>
        {isTimedOut && (
          <div className="space-y-2">
            <p className="text-sm">Taking longer than expected.</p>
            {onRefresh && (
              <Button size="sm" variant="outline" onClick={onRefresh}>
                Refresh status
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  if (status === 'ready') {
    return (
      <div className="space-y-4 py-4" aria-live="polite">
        <div className="flex items-center gap-2 font-medium text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-5 w-5" />
          Resume parsed successfully!
        </div>
        <p className="text-sm text-muted-foreground">
          Found: {skillsCount ?? 0} skills · {experienceCount ?? 0} jobs ·{' '}
          {educationCount ?? 0} education
          {confidenceScore != null ? ` · Confidence: ${confidenceScore}%` : ''}
        </p>
        {onApply && <Button onClick={onApply}>Apply to Form →</Button>}
      </div>
    );
  }

  return (
    <div className="space-y-3 py-4" role="alert">
      <p className="font-medium text-destructive">
        {status === 'failed:scan'
          ? 'File blocked: potential security threat detected.'
          : 'Could not parse resume. Please check the file or try again.'}
      </p>
      {error && <p className="text-sm text-muted-foreground">{error}</p>}
      {onCancel && (
        <Button variant="outline" onClick={onCancel}>
          Back
        </Button>
      )}
    </div>
  );
}
