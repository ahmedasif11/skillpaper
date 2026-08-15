'use client';

import { useCallback, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { FolderOpen, Plus, Upload, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api';
import { setPendingImport } from '@/lib/pendingImport';
import { useUploadedResumes } from '@/hooks/useUploadedResumes';
import { UploadedResume } from '@/types';
import { ResumeLibraryList } from '@/components/resume-import/ResumeLibraryList';
import { UploadResumePanel } from '@/components/resume-import/UploadResumePanel';

export function UploadedResumesSection() {
  const router = useRouter();
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
    patchResume,
  } = useUploadedResumes(true);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUseInForm = useCallback(
    (resume: UploadedResume) => {
      setPendingImport({ id: resume.id, label: resume.label });
      toast.info('Choose a template to fill from this resume.');
      router.push('/templates');
    },
    [router]
  );

  const handleDelete = async (resume: UploadedResume) => {
    try {
      await deleteResume(resume.id);
      toast.info('Resume deleted.');
    } catch (err: any) {
      toast.error(err?.message || 'Could not delete resume');
    }
  };

  const handleRetry = async (resume: UploadedResume) => {
    try {
      await reparse(resume.id);
      toast.info('Re-parse started.');
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

  const handleUpload = async (file: File, label?: string) => {
    setUploadError(null);
    setIsUploading(true);
    try {
      await upload(file, label);
      setUploadOpen(false);
      toast.success('Upload started. We will parse it in the background.');
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.code === 'QUOTA_EXCEEDED' || apiError.status === 429) {
        const message =
          "You've reached the 10 resume limit. Delete one to upload more.";
        setUploadError(message);
        toast.warning(message);
      } else {
        setUploadError(apiError.message || 'Upload failed');
        toast.error(apiError.message || 'Upload failed');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mb-8" id="uploaded-resumes">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <FolderOpen className="h-6 w-6" />
          My Uploaded Resumes
        </h2>
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="h-4 w-4" />
          Upload New
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center space-y-3">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : resumes.length > 0 ? (
        <ResumeLibraryList
          resumes={resumes}
          variant="dashboard"
          onUseInForm={handleUseInForm}
          onRename={handleRename}
          onDownload={handleDownload}
          onDelete={handleDelete}
          onRetry={handleRetry}
          onStatusChange={(id, status) => {
            patchResume(id, { status });
            if (status === 'ready' || status.startsWith('failed')) {
              refetch();
            }
          }}
        />
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No uploaded resumes yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Upload your existing CV to auto-fill any template form in seconds.
            </p>
            <Button onClick={() => setUploadOpen(true)}>
              <Plus className="h-4 w-4" />
              Upload
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog.Root open={uploadOpen} onOpenChange={setUploadOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed z-50 bg-background border shadow-lg p-6 overflow-y-auto inset-x-0 bottom-0 rounded-t-xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg">
            <div className="flex items-start justify-between mb-4">
              <Dialog.Title className="text-lg font-semibold">
                Upload Resume
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" aria-label="Close">
                  <X className="h-5 w-5" />
                </Button>
              </Dialog.Close>
            </div>
            <Dialog.Description className="sr-only">
              Upload a PDF or DOCX resume to parse into your library.
            </Dialog.Description>
            <UploadResumePanel
              isUploading={isUploading}
              error={uploadError}
              onUpload={handleUpload}
              onCancel={() => setUploadOpen(false)}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
