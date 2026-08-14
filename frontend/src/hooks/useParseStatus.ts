'use client';

import { useCallback, useEffect, useState } from 'react';
import { uploadedResumesAPI } from '@/lib/api';
import { ParseStatus, UploadedResumeStatus } from '@/types';

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 100;
const TERMINAL_STATES: ParseStatus[] = [
  'ready',
  'failed:scan',
  'failed:parse',
];

export function isTerminalParseStatus(status?: ParseStatus | null) {
  return !!status && TERMINAL_STATES.includes(status);
}

export function useParseStatus(id: string | null) {
  const [data, setData] = useState<UploadedResumeStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);

  const fetchOnce = useCallback(async () => {
    if (!id) return null;
    const response = await uploadedResumesAPI.getStatus(id);
    return response.data as UploadedResumeStatus;
  }, [id]);

  const refresh = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      setIsTimedOut(false);
      const next = await fetchOnce();
      if (next) setData(next);
    } catch (err: any) {
      setError(err?.message || 'Could not load parse status');
    }
  }, [fetchOnce, id]);

  useEffect(() => {
    if (!id) {
      setData(null);
      setIsPolling(false);
      setIsTimedOut(false);
      setError(null);
      return;
    }

    let cancelled = false;
    let polls = 0;
    let interval: ReturnType<typeof setInterval> | undefined;

    const stop = () => {
      if (interval) clearInterval(interval);
      setIsPolling(false);
    };

    const tick = async () => {
      try {
        const next = await fetchOnce();
        if (cancelled || !next) return;
        setData(next);
        setError(null);
        if (isTerminalParseStatus(next.status)) {
          stop();
        }
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || 'Could not load parse status');
      }
    };

    setIsTimedOut(false);
    setIsPolling(true);
    tick();

    interval = setInterval(async () => {
      polls += 1;
      if (polls >= MAX_POLLS) {
        stop();
        setIsTimedOut(true);
        return;
      }
      await tick();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [fetchOnce, id]);

  return {
    status: data?.status ?? null,
    progressHint: data?.progressHint ?? '',
    estimatedSecondsRemaining: data?.estimatedSecondsRemaining,
    isPolling,
    isTimedOut,
    error,
    refresh,
  };
}
