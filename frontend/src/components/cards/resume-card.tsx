'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Download,
  Eye,
  Edit,
  Trash2,
  Calendar,
  FileText,
  MoreVertical,
  Share2,
  Copy,
  RefreshCw,
  ExternalLink,
  Check,
} from 'lucide-react';
import { Resume } from '@/types';
import { resumesAPI, fileUtils } from '@/lib/api';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { toast } from 'sonner';

interface ResumeCardProps {
  resume: Resume;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onRefresh?: () => void;
}

export default function ResumeCard({
  resume,
  onView,
  onEdit,
  onDelete,
  onRefresh,
}: ResumeCardProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [shareCopied, setShareCopied] = useState(false);
  const { handleError } = useErrorHandler();

  const handleDownload = async () => {
    setIsLoading('download');
    try {
      const blob = await resumesAPI.download(resume._id);
      const filename = `resume-${resume.data.name || resume._id}.pdf`;
      fileUtils.downloadBlob(blob, filename);
      toast.success('Resume downloaded successfully');
    } catch (error) {
      handleError(error);
      toast.error('Failed to download resume');
    } finally {
      setIsLoading(null);
    }
  };

  const handlePreview = async () => {
    setIsLoading('preview');
    try {
      const response = await resumesAPI.preview(resume._id);
      const blob = fileUtils.base64ToBlob(response.pdf);
      fileUtils.openBlob(blob);
    } catch (error) {
      handleError(error);
      toast.error('Failed to preview resume');
    } finally {
      setIsLoading(null);
    }
  };

  const handleRegenerate = async () => {
    setIsLoading('regenerate');
    try {
      await resumesAPI.regenerate(resume._id);
      toast.success('Resume PDF regenerated successfully');
      if (onRefresh) onRefresh();
    } catch (error) {
      handleError(error);
      toast.error('Failed to regenerate resume');
    } finally {
      setIsLoading(null);
    }
  };

  const handleShare = async () => {
    setIsLoading('share');
    try {
      const response = await resumesAPI.share(resume._id, 30);
      setShareUrl(response.shareUrl);
      toast.success('Share link created successfully');
    } catch (error) {
      handleError(error);
      toast.error('Failed to create share link');
    } finally {
      setIsLoading(null);
    }
  };

  const handleUnshare = async () => {
    setIsLoading('unshare');
    try {
      await resumesAPI.unshare(resume._id);
      setShareUrl('');
      toast.success('Share link removed successfully');
      if (onRefresh) onRefresh();
    } catch (error) {
      handleError(error);
      toast.error('Failed to remove share link');
    } finally {
      setIsLoading(null);
    }
  };

  const copyShareUrl = async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareCopied(true);
        toast.success('Share link copied to clipboard');
        setTimeout(() => setShareCopied(false), 2000);
      } catch (error) {
        toast.error('Failed to copy share link');
      }
    }
  };

  const confirmDelete = async () => {
    setIsLoading('delete');
    try {
      await resumesAPI.delete(resume._id);
      toast.success('Resume deleted successfully');
      onDelete(resume._id);
    } catch (error) {
      handleError(error);
      toast.error('Failed to delete resume');
    } finally {
      setIsLoading(null);
    }
  };

  const templateName =
    typeof resume.template === 'object'
      ? resume.template.name
      : 'Unknown Template';

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-foreground">
              {resume.data.name || 'Untitled Resume'}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Template: {templateName}
            </p>
            {resume.data.title && (
              <p className="text-sm text-gray-500 mt-1">{resume.data.title}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {resume.isPublic && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <Share2 className="h-3 w-3 mr-1" />
                Shared
              </Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(resume._id)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(resume._id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handlePreview}
                  disabled={isLoading === 'preview'}
                >
                  {isLoading === 'preview' ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4 mr-2" />
                  )}
                  Preview PDF
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleRegenerate}
                  disabled={isLoading === 'regenerate'}
                >
                  {isLoading === 'regenerate' ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Regenerate PDF
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {resume.isPublic ? (
                  <DropdownMenuItem
                    onClick={handleUnshare}
                    disabled={isLoading === 'unshare'}
                  >
                    {isLoading === 'unshare' ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Share2 className="h-4 w-4 mr-2" />
                    )}
                    Remove Sharing
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={handleShare}
                    disabled={isLoading === 'share'}
                  >
                    {isLoading === 'share' ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Share2 className="h-4 w-4 mr-2" />
                    )}
                    Share Resume
                  </DropdownMenuItem>
                )}
                {shareUrl && (
                  <DropdownMenuItem onClick={copyShareUrl}>
                    {shareCopied ? (
                      <Check className="h-4 w-4 mr-2 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    {shareCopied ? 'Copied!' : 'Copy Share Link'}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Trash2 className="h-4 w-4 mr-2 text-red-600" />
                      Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Resume</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this resume? This action
                        cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={confirmDelete}
                        disabled={isLoading === 'delete'}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isLoading === 'delete' ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-2" />
            <span>
              Created: {new Date(resume.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div className="flex items-center text-sm text-gray-500">
            <FileText className="h-4 w-4 mr-2" />
            <span>
              Updated: {new Date(resume.updatedAt).toLocaleDateString()}
            </span>
          </div>

          {shareUrl && (
            <div className="p-2 bg-blue-50 rounded border border-blue-200">
              <p className="text-xs text-blue-600 font-medium mb-1">
                Share Link:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 text-xs p-1 border rounded bg-white"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyShareUrl}
                  className="text-xs px-2 py-1"
                >
                  {shareCopied ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(resume._id)}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(resume._id)}
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={isLoading === 'download'}
              className="flex-1"
            >
              {isLoading === 'download' ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Download
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
