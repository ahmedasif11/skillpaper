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
import { notFound } from 'next/navigation';
import { toast } from 'sonner';


interface TemplateDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function TemplateDetailsPage({
  params,
}: TemplateDetailsPageProps) {
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const resolvedParams = await params;
        const response = await templatesAPI.getById(resolvedParams.id);
        if (response.template) {
          const transformedTemplate = transformBackendTemplate(
            response.template
          );
          setTemplate(transformedTemplate);
        } else {
          toast.error('Template not found');
          setTemplate(null);
        }
      } catch (err) {
        console.error('Error fetching template:', err);
        toast.error('Failed to load template');
        setTemplate(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen py-8 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto dark:border-white"></div>
            <p className="text-muted-foreground mt-4">Loading template...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!template) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            asChild
            className="flex items-center space-x-2"
          >
            <Link href="/templates">
              <ArrowLeft className="h-4 w-4 text-foreground" />
              <span>Back to Templates</span>
            </Link>
          </Button>
        </div>

        <div className="grid lg:grid-cols-[1.35fr_1fr] gap-12">
          {/* Template Preview — full scaled page, scrollable */}
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative">
                  <div className="max-h-[min(85vh,64rem)] overflow-y-auto overflow-x-hidden bg-muted/30 p-4 sm:p-6">
                    <TemplateThumbnail
                      template={template}
                      clip={false}
                      className="shadow-sm mx-auto max-w-[794px]"
                    />
                  </div>
                  {template.isPro && (
                    <Badge
                      variant="secondary"
                      className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 z-10 pointer-events-none"
                    >
                      <Crown className="w-3 h-3 mr-1" />
                      PRO
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Template Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-3xl font-bold">{template.title}</h1>
                <Badge variant="outline">{template.category}</Badge>
              </div>
              <p className="text-lg text-muted-foreground mb-6">
                {template.description}
              </p>
            </div>

            {/* Features */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Template Features</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>
                      ATS-friendly formatting ensures your resume passes through
                      applicant tracking systems
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>
                      Professional layout optimized for{' '}
                      {template.category.toLowerCase()} roles
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>
                      Clean, modern design that highlights your key
                      qualifications
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>
                      Optimized spacing and typography for excellent readability
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>
                      Industry-standard format preferred by hiring managers
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Best For */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Best For</h3>
                <div className="flex flex-wrap gap-2">
                  {template.category === 'Professional' && (
                    <>
                      <Badge variant="secondary">Corporate Roles</Badge>
                      <Badge variant="secondary">Management Positions</Badge>
                      <Badge variant="secondary">Finance & Consulting</Badge>
                      <Badge variant="secondary">Business Development</Badge>
                    </>
                  )}
                  {template.category === 'Creative' && (
                    <>
                      <Badge variant="secondary">Design Roles</Badge>
                      <Badge variant="secondary">Marketing</Badge>
                      <Badge variant="secondary">Creative Director</Badge>
                      <Badge variant="secondary">Agency Work</Badge>
                    </>
                  )}
                  {template.category === 'Tech' && (
                    <>
                      <Badge variant="secondary">Software Engineering</Badge>
                      <Badge variant="secondary">Data Science</Badge>
                      <Badge variant="secondary">Product Management</Badge>
                      <Badge variant="secondary">DevOps</Badge>
                    </>
                  )}
                  {template.category === 'Academic' && (
                    <>
                      <Badge variant="secondary">Research Positions</Badge>
                      <Badge variant="secondary">University Roles</Badge>
                      <Badge variant="secondary">Scientific Roles</Badge>
                      <Badge variant="secondary">PhD Applications</Badge>
                    </>
                  )}
                  {template.category === 'Minimal' && (
                    <>
                      <Badge variant="secondary">Any Industry</Badge>
                      <Badge variant="secondary">Clean Aesthetic</Badge>
                      <Badge variant="secondary">Entry Level</Badge>
                      <Badge variant="secondary">Career Changers</Badge>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-4">
              <Button size="lg" className="w-full" asChild>
                <Link href={`/resume/form?template=${template.id}`}>
                  Use This Template
                </Link>
              </Button>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {template.isPro
                    ? 'Premium template with advanced features'
                    : 'Free template'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
