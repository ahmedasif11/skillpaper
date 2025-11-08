'use client';

import { useState, useCallback } from 'react';
import { ApiError } from '@/lib/api';

interface ErrorState {
  error: ApiError | null;
  isError: boolean;
}

export const useErrorHandler = () => {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isError: false,
  });

  const handleError = useCallback((error: ApiError | Error | unknown) => {
    let apiError: ApiError;

    if (error && typeof error === 'object' && 'message' in error) {
      apiError = error as ApiError;
    } else {
      apiError = {
        message: 'An unexpected error occurred',
        status: 500,
      };
    }

    setErrorState({
      error: apiError,
      isError: true,
    });

    // Log error for debugging
    console.error('Error handled:', apiError);

    return apiError;
  }, []);

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isError: false,
    });
  }, []);

  const getErrorMessage = useCallback(
    (error?: ApiError) => {
      const err = error || errorState.error;
      if (!err) return '';

      // Handle validation errors with details
      if (err.details && typeof err.details === 'object') {
        const details = err.details as any;
        if (details.errors && Array.isArray(details.errors)) {
          return details.errors.join(', ');
        }
        if (details.message) {
          return details.message;
        }
      }

      return err.message;
    },
    [errorState.error]
  );

  const getErrorStatus = useCallback(
    (error?: ApiError) => {
      const err = error || errorState.error;
      return err?.status || 500;
    },
    [errorState.error]
  );

  const isNetworkError = useCallback(
    (error?: ApiError) => {
      const err = error || errorState.error;
      return err?.message?.includes('Network error') || false;
    },
    [errorState.error]
  );

  const isValidationError = useCallback(
    (error?: ApiError) => {
      const err = error || errorState.error;
      return err?.status === 422 || err?.status === 400;
    },
    [errorState.error]
  );

  const isAuthError = useCallback(
    (error?: ApiError) => {
      const err = error || errorState.error;
      return err?.status === 401 || err?.status === 403;
    },
    [errorState.error]
  );

  const isNotFoundError = useCallback(
    (error?: ApiError) => {
      const err = error || errorState.error;
      return err?.status === 404;
    },
    [errorState.error]
  );

  return {
    ...errorState,
    handleError,
    clearError,
    getErrorMessage,
    getErrorStatus,
    isNetworkError,
    isValidationError,
    isAuthError,
    isNotFoundError,
  };
};

export default useErrorHandler;

