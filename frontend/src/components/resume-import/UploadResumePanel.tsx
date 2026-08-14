'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Paperclip } from 'lucide-react';
import {
  ACCEPTED_RESUME_TYPES,
  MAX_RESUME_BYTES,
  formatFileSize,
} from './format';

interface UploadResumePanelProps {
  isUploading?: boolean;
  error?: string | null;
  onUpload: (file: File, label?: string) => Promise<void> | void;
  onCancel?: () => void;
}

export function UploadResumePanel({
  isUploading = false,
  error,
  onUpload,
  onCancel,
}: UploadResumePanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const setSelectedFile = (next: File | null) => {
    setLocalError(null);
    if (!next) {
      setFile(null);
      return;
    }
    if (!ACCEPTED_RESUME_TYPES.includes(next.type)) {
      setLocalError('Unsupported format. Please upload a PDF or DOCX file.');
      return;
    }
    if (next.size > MAX_RESUME_BYTES) {
      setLocalError('File exceeds 10 MB.');
      return;
    }
    setFile(next);
    if (!label) {
      setLabel(next.name.replace(/\.[^.]+$/, '').slice(0, 100));
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) setSelectedFile(dropped);
  };

  const handleKeyActivate = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      inputRef.current?.click();
    }
  };

  const displayError = localError || error;

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        aria-label="Choose a resume file to upload"
        aria-describedby={displayError ? 'upload-resume-error' : 'upload-resume-hint'}
        onKeyDown={handleKeyActivate}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        }`}
      >
        <Paperclip className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
        <p className="font-medium">Drag & drop your resume here</p>
        <p id="upload-resume-hint" className="text-sm text-muted-foreground mt-1">
          PDF or DOCX — max 10 MB
        </p>
        {file && (
          <p className="text-sm mt-3">
            {file.name} · {formatFileSize(file.size)}
          </p>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={(event) => {
            event.stopPropagation();
            inputRef.current?.click();
          }}
        >
          Choose File
        </Button>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="resume-label">Label (optional)</Label>
        <Input
          id="resume-label"
          maxLength={100}
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder='e.g. "Software Engineer Resume"'
        />
      </div>

      {displayError && (
        <p id="upload-resume-error" className="text-sm text-destructive" role="alert">
          {displayError}
        </p>
      )}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isUploading}>
            Cancel
          </Button>
        )}
        <Button
          type="button"
          disabled={!file || isUploading}
          onClick={() => file && onUpload(file, label.trim() || undefined)}
        >
          {isUploading ? 'Uploading...' : 'Upload & Parse →'}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Your resume will be processed by Gemini AI. See our Privacy Policy.
      </p>
    </div>
  );
}
