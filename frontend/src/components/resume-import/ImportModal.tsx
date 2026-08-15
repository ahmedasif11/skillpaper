'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Paperclip, X } from 'lucide-react';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api';
import { useUploadedResumes } from '@/hooks/useUploadedResumes';
import { useParseStatus } from '@/hooks/useParseStatus';
import { hydrateFormFromParsedResume } from '@/lib/hydrateFormFromParsedResume';
import {
  ParsedResumeData,
  UploadedResume,
  UploadedResumeParsedPayload,
} from '@/types';
import { ImportPreview } from './ImportPreview';
import { InlineUploadProgress } from './InlineUploadProgress';
import { ResumeLibraryList } from './ResumeLibraryList';
import { UploadResumePanel } from './UploadResumePanel';

type View = 'library' | 'upload' | 'progress' | 'preview';

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (formData: ReturnType<typeof hydrateFormFromParsedResume>, meta: { id: string; label: string }) => void;
  initialResumeId?: string | null;
}

export function ImportModal({
  open,
  onOpenChange,
  onApply,
  initialResumeId,
}: ImportModalProps) {
  const {
    resumes,
    isLoading,
    error,
    upload,
    rename,
    download,
    deleteResume,
    reparse,
    refetch,
    getParsedData,
    patchResume,
  } = useUploadedResumes(open);

  const [view, setView] = useState<View>('library');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [previewResume, setPreviewResume] = useState<UploadedResume | null>(null);
  const [parsedPayload, setParsedPayload] = useState<UploadedResumeParsedPayload | null>(null);

  const parseStatus = useParseStatus(
    open && view === 'progress' ? trackingId : null
  );
  const lastToastStatus = useRef<string | null>(null);
  const didPrefill = useRef(false);

  const reset = useCallback(() => {
    setView('library');
    setUploadError(null);
    setIsUploading(false);
    setUploadPercent(0);
    setPendingFile(null);
    setTrackingId(null);
    setPreviewResume(null);
    setParsedPayload(null);
    lastToastStatus.current = null;
  }, []);

  useEffect(() => {
    if (open) {
      reset();
      refetch();
    }
  }, [open, refetch, reset]);

  const loadPreview = useCallback(
    async (resume: UploadedResume) => {
      try {
        const data = await getParsedData(resume.id);
        setPreviewResume(resume);
        setParsedPayload(data);
        setView('preview');
      } catch (err: any) {
        toast.error(err?.message || 'Parsed data is not ready yet.');
      }
    },
    [getParsedData]
  );

  useEffect(() => {
    if (!open) {
      didPrefill.current = false;
      return;
    }
    if (didPrefill.current || !initialResumeId || isLoading) return;
    const match = resumes.find((item) => item.id === initialResumeId);
    if (match?.status === 'ready') {
      didPrefill.current = true;
      loadPreview(match);
    }
  }, [open, initialResumeId, isLoading, resumes, loadPreview]);

  useEffect(() => {
    if (view !== 'progress' || !trackingId || !parseStatus.status) return;
    if (lastToastStatus.current === parseStatus.status) return;
    if (parseStatus.status === 'ready') {
      lastToastStatus.current = parseStatus.status;
      toast.success('Resume parsed! Ready to apply.');
      const resume =
        resumes.find((item) => item.id === trackingId) ||
        ({
          id: trackingId,
          label: pendingFile?.name || 'Uploaded resume',
          filename: pendingFile?.name || '',
          fileSize: pendingFile?.size || 0,
          mimeType: pendingFile?.type || '',
          status: 'ready',
          parseError: null,
          confidenceScore: null,
          isOcrExtracted: false,
          parsedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as UploadedResume);
      loadPreview(resume);
    } else if (parseStatus.status === 'failed:scan') {
      lastToastStatus.current = parseStatus.status;
      toast.error('File blocked: potential security threat detected.', {
        duration: Infinity,
      });
    } else if (parseStatus.status === 'failed:parse') {
      lastToastStatus.current = parseStatus.status;
      toast.error('Could not parse resume. Please check the file or try again.');
    }
  }, [
    view,
    trackingId,
    parseStatus.status,
    resumes,
    pendingFile,
    loadPreview,
  ]);

  const handleUpload = async (file: File, label?: string) => {
    setUploadError(null);
    setIsUploading(true);
    setPendingFile(file);
    setUploadPercent(0);
    setView('progress');
    try {
      const created = await upload(file, label, setUploadPercent);
      setTrackingId(created.id);
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.code === 'QUOTA_EXCEEDED' || apiError.status === 429) {
        toast.warning(
          "You've reached the 10 resume limit. Delete one to upload more."
        );
      } else {
        toast.error(apiError.message || 'Upload failed');
      }
      setUploadError(apiError.message || 'Upload failed');
      setView('upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleApply = (parsed: ParsedResumeData, resume: UploadedResume) => {
    const formData = hydrateFormFromParsedResume(parsed);
    onApply(formData, { id: resume.id, label: resume.label });
    toast.success(`Form filled from ${resume.label}`);
    onOpenChange(false);
  };

  const handleDelete = async (resume: UploadedResume) => {
    try {
      await deleteResume(resume.id);
      toast.info('Resume deleted.');
      if (trackingId === resume.id) {
        reset();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Could not delete resume');
    }
  };

  const handleRetry = async (resume: UploadedResume) => {
    try {
      await reparse(resume.id);
      setTrackingId(resume.id);
      setView('progress');
    } catch (err: any) {
      toast.error(err?.message || 'Could not start re-parse');
    }
  };

  const handleRename = async (resume: UploadedResume, label: string) => {
    try {
      await rename(resume.id, label);
      toast.success('Resume renamed.');
    } catch (err: any) {
      toast.error(err?.message || 'Could not rename resume');
      throw err;
    }
  };

  const handleDownload = async (resume: UploadedResume) => {
    try {
      await download(resume.id);
    } catch (err: any) {
      toast.error(err?.message || 'Could not download resume');
    }
  };

  const readyCount = resumes.filter((item) => item.status === 'ready').length;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed z-50 bg-background border shadow-lg p-6 overflow-y-auto inset-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-h-[85vh] sm:rounded-lg">
          <div className="flex items-start justify-between gap-3 mb-4">
            <Dialog.Title className="text-lg font-semibold">
              Import from Resume
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close">
                <X className="h-5 w-5" />
              </Button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Choose an uploaded resume or upload a new file to auto-fill the form.
          </Dialog.Description>

          {view === 'library' && (
            <div className="space-y-4">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading your library...</p>
              ) : error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : resumes.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <Paperclip className="h-10 w-10 mx-auto text-muted-foreground" />
                  <p className="font-medium">No uploaded resumes yet</p>
                  <p className="text-sm text-muted-foreground">
                    Upload your existing CV to auto-fill this form
                  </p>
                  <Button onClick={() => setView('upload')}>
                    Upload Your Resume →
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Supported formats: PDF, DOCX · Max size: 10 MB
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Select a resume to auto-fill all form fields:
                  </p>
                  <ResumeLibraryList
                    resumes={resumes}
                    variant="select"
                    onSelect={loadPreview}
                    onRename={handleRename}
                    onDownload={handleDownload}
                    onDelete={handleDelete}
                    onRetry={handleRetry}
                    onStatusChange={(id, status) => {
                      patchResume(id, { status });
                      if (status === 'ready') refetch();
                    }}
                  />
                  <div className="pt-2 border-t">
                    <p className="text-sm mb-2">Or upload a new resume</p>
                    <Button variant="outline" onClick={() => setView('upload')}>
                      Upload New File
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {readyCount} ready · {resumes.length} of 10 slots used
                  </p>
                </>
              )}
            </div>
          )}

          {view === 'upload' && (
            <UploadResumePanel
              isUploading={isUploading}
              error={uploadError}
              onUpload={handleUpload}
              onCancel={() => setView('library')}
            />
          )}

          {view === 'progress' && (
            <InlineUploadProgress
              filename={pendingFile?.name || previewResume?.filename || 'resume'}
              fileSize={pendingFile?.size || previewResume?.fileSize}
              uploadPercent={uploadPercent}
              status={isUploading ? 'uploading' : parseStatus.status || 'uploaded'}
              progressHint={parseStatus.progressHint}
              estimatedSecondsRemaining={parseStatus.estimatedSecondsRemaining}
              isTimedOut={parseStatus.isTimedOut}
              error={parseStatus.error}
              onCancel={() => {
                setTrackingId(null);
                setView('library');
              }}
              onRefresh={parseStatus.refresh}
              onApply={() => {
                const resume = resumes.find((item) => item.id === trackingId);
                if (resume) loadPreview(resume);
              }}
            />
          )}

          {view === 'preview' && previewResume && parsedPayload && (
            <ImportPreview
              resume={previewResume}
              parsedData={parsedPayload.parsedData}
              confidenceScore={parsedPayload.confidenceScore}
              onBack={() => {
                setView('library');
                setParsedPayload(null);
              }}
              onApply={() =>
                handleApply(parsedPayload.parsedData, previewResume)
              }
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
