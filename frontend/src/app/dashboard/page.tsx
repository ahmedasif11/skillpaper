'use client';

import { Plus, FileText, LayoutTemplate, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import ResumeCard from '../../components/cards/resume-card';
import ErrorBoundary from '../../components/common/error-boundary';
import ProtectedRoute from '../../components/common/protected-route';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Resume } from '../../types';
import { useRouter } from 'next/navigation';
import { resumesAPI } from '../../lib/api';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { useAuthContext } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { Skeleton } from '../../components/ui/skeleton';

export default function DashboardPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();
  const { handleError, isError, error, clearError } = useErrorHandler();
  const { user } = useAuthContext();

  const loadResumes = async () => {
    try {
      setIsLoading(true);
      clearError();
      const response = await resumesAPI.getUserResumes();
      setResumes(response.resumes || []);
    } catch (error) {
      handleError(error);
      toast.error('Failed to load resumes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadResumes();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadResumes();
      toast.success('Resumes refreshed');
    } catch (error) {
      handleError(error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleViewResume = (id: string) => {
    router.push(`/resume/preview?id=${id}`);
  };

  const handleEditResume = (id: string) => {
    router.push(`/resume/form?id=${id}`);
  };

  const handleDeleteResume = (id: string) => {
    setResumes((prev) => prev.filter((resume) => resume._id !== id));
  };

  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <div className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words">
                    Welcome back{user?.name ? `, ${user.name}` : ''}!
                  </h1>
                  <p className="text-muted-foreground">
                    Manage your resumes and create new ones
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="self-start sm:self-auto"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </Button>
              </div>
            </div>

            {isError && error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error.message}
                  <Button
                    variant="link"
                    size="sm"
                    onClick={clearError}
                    className="ml-2 p-0 h-auto"
                  >
                    Dismiss
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Create New Resume</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start from a professional template with a live preview
                  </p>
                  <Button asChild className="w-full">
                    <Link href="/templates">
                      <Plus className="mr-2 h-4 w-4" />
                      Choose Template
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Templates</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Browse the catalog and preview layouts before you write
                  </p>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/templates">
                      <LayoutTemplate className="mr-2 h-4 w-4" />
                      Browse Templates
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="mb-8" id="your-resumes">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <h2 className="text-xl sm:text-2xl font-bold">
                  Your Resumes ({resumes.length})
                </h2>
                <Button asChild>
                  <Link href="/templates">
                    <Plus className="mr-2 h-4 w-4" />
                    New Resume
                  </Link>
                </Button>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[0, 1, 2].map((key) => (
                    <Skeleton key={key} className="h-56 w-full rounded-xl" />
                  ))}
                </div>
              ) : resumes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {resumes.map((resume) => (
                    <ResumeCard
                      key={resume._id}
                      resume={resume}
                      onView={handleViewResume}
                      onEdit={handleEditResume}
                      onDelete={handleDeleteResume}
                      onRefresh={loadResumes}
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No resumes yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first resume to get started
                    </p>
                    <Button asChild>
                      <Link href="/templates">Create Resume</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </ProtectedRoute>
  );
}
