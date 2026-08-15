'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError, uploadedResumesAPI } from '@/lib/api';
import {
  UploadedResume,
  UploadedResumeDownload,
  UploadedResumeParsedPayload,
} from '@/types';

function normalizeUploadedResume(item: UploadedResume): UploadedResume {
  return {
    ...item,
    mimeType: item.mimeType || '',
    parseError: item.parseError ?? null,
    isOcrExtracted: !!item.isOcrExtracted,
    confidenceScore: item.confidenceScore ?? null,
    parsedAt: item.parsedAt ?? null,
  };
}

export function useUploadedResumes(enabled = true) {
  const [resumes, setResumes] = useState<UploadedResume[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!enabled) return;
    try {
      setIsLoading(true);
      setError(null);
      const response = await uploadedResumesAPI.list();
      setResumes((response.data || []).map(normalizeUploadedResume));
    } catch (err: any) {
      setError(err?.message || 'Failed to load uploaded resumes');
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const upload = useCallback(
    async (
      file: File,
      label?: string,
      onUploadProgress?: (percent: number) => void
    ) => {
      const response = await uploadedResumesAPI.upload(
        file,
        label,
        onUploadProgress
      );
      const created = normalizeUploadedResume(response.data as UploadedResume);
      setResumes((prev) => [created, ...prev.filter((item) => item.id !== created.id)]);
      return created;
    },
    []
  );

  const rename = useCallback(async (id: string, label: string) => {
    const response = await uploadedResumesAPI.updateLabel(id, label);
    const next = response.data as { label?: string; updatedAt?: string };
    setResumes((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              label: next?.label ?? label.trim(),
              updatedAt: next?.updatedAt ?? item.updatedAt,
            }
          : item
      )
    );
    return next;
  }, []);

  const download = useCallback(async (id: string) => {
    const response = await uploadedResumesAPI.download(id);
    const payload = (response?.data ?? response) as UploadedResumeDownload;
    await openOrSaveFile(payload.url, payload.filename);
    return payload;
  }, []);

  const remove = useCallback(async (id: string) => {
    await uploadedResumesAPI.delete(id);
    setResumes((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const reparse = useCallback(async (id: string) => {
    const response = await uploadedResumesAPI.reparse(id);
    const status = response.data?.status;
    setResumes((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: status || 'uploaded' } : item
      )
    );
    return response.data;
  }, []);

  const getParsedData = useCallback(async (id: string) => {
    const response = await uploadedResumesAPI.getData(id);
    const payload = (response?.data ?? response) as UploadedResumeParsedPayload & {
      data?: UploadedResumeParsedPayload;
    };
    if (payload?.parsedData) return payload;
    if (payload?.data?.parsedData) return payload.data;
    return payload;
  }, []);

  const patchResume = useCallback(
    (id: string, patch: Partial<UploadedResume>) => {
      setResumes((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
      );
    },
    []
  );

  return {
    resumes,
    isLoading,
    error,
    upload,
    rename,
    download,
    deleteResume: remove,
    reparse,
    refetch,
    getParsedData,
    patchResume,
    apiError: error as unknown as ApiError | null,
  };
}

async function openOrSaveFile(url: string, filename: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Download failed');
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
