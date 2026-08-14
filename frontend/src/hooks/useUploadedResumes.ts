'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError, uploadedResumesAPI } from '@/lib/api';
import {
  UploadedResume,
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
    deleteResume: remove,
    reparse,
    refetch,
    getParsedData,
    patchResume,
    apiError: error as unknown as ApiError | null,
  };
}
