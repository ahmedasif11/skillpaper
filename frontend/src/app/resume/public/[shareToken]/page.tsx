'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  ArrowLeft,
  Calendar,
  User,
  FileText,
  AlertCircle,
  RefreshCw,
  Share2,
} from 'lucide-react';
import { resumesAPI, fileUtils } from '@/lib/api';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { toast } from 'sonner';
import Link from 'next/link';

interface PublicResumeData {
  id: string;
  name: string;
  title: string;
  summary: string;
  template: string;
  createdAt: string;
  sharedBy: string;
}

export default function PublicResumePage() {
  const params = useParams();
  const router = useRouter();
  const shareToken = params.shareToken as string;

  const [resume, setResume] = useState<PublicResumeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  const { handleError, isError, error } = useErrorHandler();

  useEffect(() => {
    if (shareToken) {
      loadPublicResume();
    }
  }, [shareToken]);

  const loadPublicResume = async () => {
    try {
      setIsLoading(true);
      const response = await resumesAPI.getPublic(shareToken);
      setResume(response.resume);
    } catch (error) {
      handleError(error);
      toast.error('Failed to load shared resume');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const blob = await resumesAPI.downloadPublic(shareToken);
      const filename = `resume-${resume?.name || 'shared'}.pdf`;
      fileUtils.downloadBlob(blob, filename);
      toast.success('Resume downloaded successfully');
    } catch (error) {
      handleError(error);
      toast.error('Failed to download resume');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading shared resume...</p>
        </div>
      </div>
    );
  }

  if (isError || !resume) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Resume Not Found
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                {error?.message ||
                  'This shared resume could not be found or may have expired.'}
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2 text-foreground" />
                Go Back
              </Button>
              <Button asChild>
                <Link href="/">Go Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Share2 className="h-3 w-3" />
              Shared Resume
            </Badge>
          </div>
          <h1 className="text-3xl font-bold mb-2">{resume.name}</h1>
          {resume.title && (
            <p className="text-xl text-muted-foreground mb-4">{resume.title}</p>
          )}
        </div>

        {/* Resume Info */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Candidate Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Name
                </p>
                <p className="text-lg">{resume.name}</p>
              </div>
              {resume.title && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Title
                  </p>
                  <p>{resume.title}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Shared by
                </p>
                <p>{resume.sharedBy}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Resume Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Template
                </p>
                <p>{resume.template}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Created
                </p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(resume.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        {resume.summary && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Professional Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {resume.summary}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Download Resume</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Download the complete resume as a PDF file.
            </p>
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-2"
            >
              {isDownloading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isDownloading ? 'Downloading...' : 'Download PDF'}
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>This resume was shared using SkillPaper Resume Builder</p>
          <Button variant="link" asChild className="mt-2">
            <Link href="/">Create your own resume</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
