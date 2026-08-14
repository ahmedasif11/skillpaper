'use client';

import React from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { ArrowLeft, Crown } from 'lucide-react';
import { TemplateThumbnail } from '../../../components/cards/template-thumbnail';
import { templatesAPI } from '../../../lib/api';
import { transformBackendTemplate } from '../../../lib/templateTransform';
import { Template } from '../../../types';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import LoadingSpinner from '../../../components/common/loading-spinner';
import { Skeleton } from '../../../components/ui/skeleton';

interface TemplateDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

const BEST_FOR: Record<string, string[]> = {
  Professional: [
    'Corporate Roles',
    'Management Positions',
    'Finance & Consulting',
    'Business Development',
  ],
  Creative: ['Design Roles', 'Marketing', 'Creative Director', 'Agency Work'],
  Tech: [
    'Software Engineering',
    'Data Science',
    'Product Management',
    'DevOps',
  ],
  Academic: [
    'Research Positions',
    'University Roles',
    'Scientific Roles',
    'PhD Applications',
  ],
  Minimal: ['Any Industry', 'Clean Aesthetic', 'Entry Level', 'Career Changers'],
};

export default function TemplateDetailsPage({
  params,
}: TemplateDetailsPageProps) {
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundTemplate, setNotFoundTemplate] = useState(false);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const resolvedParams = await params;
        const response = await templatesAPI.getById(resolvedParams.id);
        if (response.template) {
          setTemplate(transformBackendTemplate(response.template));
          setNotFoundTemplate(false);
        } else {
          toast.error('Template not found');
          setNotFoundTemplate(true);
        }
      } catch (err) {
        console.error('Error fetching template:', err);
        toast.error('Failed to load template');
        setNotFoundTemplate(true);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [params]);

  if (loading) {
    return (
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <LoadingSpinner text="Loading template..." />
          <Skeleton className="h-[60vh] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (notFoundTemplate || !template) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Template not found</h1>
          <p className="text-muted-foreground">
            This template may have been removed or the link is incorrect.
          </p>
          <Button asChild>
            <Link href="/templates">Back to templates</Link>
          </Button>
        </div>
      </div>
    );
  }

  const bestFor =
    BEST_FOR[template.category] ||
    [`${template.category} roles`, 'Professional applications'];

  return (
    <div className="bg-background pb-24 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-between gap-3 mb-6">
          <Button variant="ghost" asChild className="shrink-0">
            <Link href="/templates">
              <ArrowLeft className="h-4 w-4 text-foreground" />
              <span>Back</span>
            </Link>
          </Button>
          <Button className="hidden lg:inline-flex" asChild>
            <Link href={`/resume/form?template=${template.id}`}>
              Use this template
            </Link>
          </Button>
        </div>

        <div className="grid lg:grid-cols-[1.35fr_1fr] gap-8 lg:gap-12">
          <div className="space-y-4 min-w-0 overflow-x-hidden">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative">
                  <div className="max-h-[min(52vh,28rem)] lg:max-h-[min(85vh,64rem)] overflow-y-auto overflow-x-hidden bg-muted/30 p-3 sm:p-6">
                    <TemplateThumbnail
                      template={template}
                      clip={false}
                      className="shadow-sm mx-auto max-w-full"
                    />
                  </div>
                  {template.isPro && (
                    <Badge
                      variant="secondary"
                      className="absolute top-4 right-4 bg-primary text-primary-foreground border-0 z-10 pointer-events-none"
                    >
                      <Crown className="w-3 h-3 mr-1" />
                      PRO
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <h1 className="text-2xl sm:text-3xl font-bold break-words">
                  {template.title}
                </h1>
                <Badge variant="outline">{template.category}</Badge>
              </div>
              <p className="text-muted-foreground mb-2">
                {template.description}
              </p>
            </div>

            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold mb-4">Template Features</h2>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>
                      ATS-friendly formatting for applicant tracking systems
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>
                      Layout suited to {template.category.toLowerCase()} roles
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>
                      Live HTML preview matches the PDF export path
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold mb-4">Best For</h2>
                <div className="flex flex-wrap gap-2">
                  {bestFor.map((item) => (
                    <Badge key={item} variant="secondary">
                      {item}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="hidden lg:block space-y-2">
              <Button size="lg" className="w-full" asChild>
                <Link href={`/resume/form?template=${template.id}`}>
                  Use This Template
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                {template.isPro
                  ? 'Premium template with advanced features'
                  : 'Free template'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur pb-safe">
        <div className="px-4 py-3">
          <Button size="lg" className="w-full" asChild>
            <Link href={`/resume/form?template=${template.id}`}>
              Use this template
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
