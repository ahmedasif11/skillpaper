'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, FileText, Zap, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useAuthContext } from '../contexts/AuthContext';
import Link from 'next/link';
import { templatesAPI } from '../lib/api';
import { transformBackendTemplates } from '../lib/templateTransform';
import { Template } from '../types';
import { TemplateThumbnail } from '../components/cards/template-thumbnail';
import { Skeleton } from '../components/ui/skeleton';

export default function HomePage() {
  const { isAuthenticated } = useAuthContext();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await templatesAPI.getAll();
        if (response.templates?.length) {
          setTemplates(transformBackendTemplates(response.templates).slice(0, 3));
        }
      } catch {
        setTemplates([]);
      } finally {
        setLoadingTemplates(false);
      }
    };
    load();
  }, []);

  const features = [
    {
      icon: FileText,
      title: 'Live template previews',
      description:
        'See the actual resume HTML before you start — the same templates used for PDF export.',
    },
    {
      icon: Zap,
      title: 'Guided builder',
      description:
        'Fill personal info, experience, skills, and more in a step-by-step form.',
    },
    {
      icon: ShieldCheck,
      title: 'ATS-friendly output',
      description:
        'Clean structure and Handlebars templates designed to parse well in applicant tracking systems.',
    },
  ];

  return (
    <div>
      <section className="bg-gradient-to-b from-background to-muted/40 py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent break-words leading-tight">
            Build a resume that looks as good as it reads
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            SkillPaper is a resume builder with live template previews, a
            guided form, and PDF export — no fake stats, just the tools you
            need.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isAuthenticated ? (
              <>
                <Button size="lg" asChild className="group">
                  <Link href="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/templates">Browse templates</Link>
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" asChild className="group">
                  <Link href="/templates">
                    Choose a template
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Templates you can actually preview
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Live HTML previews — not stock photos. Pick one and start filling
              in your details.
            </p>
          </div>
          {loadingTemplates ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[0, 1, 2].map((key) => (
                <Skeleton key={key} className="h-72 w-full rounded-xl" />
              ))}
            </div>
          ) : templates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <Link
                  key={template.id}
                  href={`/templates/${template.id}`}
                  className="group block rounded-xl border border-border overflow-hidden bg-card hover:shadow-lg transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <TemplateThumbnail
                    template={template}
                    heightClassName="h-56 sm:h-64"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {template.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {template.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Templates will appear here once the catalog is available.
              </p>
              <Button asChild>
                <Link href="/templates">Open template gallery</Link>
              </Button>
            </div>
          )}
          <div className="text-center mt-8">
            <Button variant="outline" asChild>
              <Link href="/templates">View all templates</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Why SkillPaper
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A focused builder: pick a template, fill the form, preview, then
              download.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="text-center p-2">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Ready to start?
          </h2>
          <p className="text-muted-foreground mb-8">
            Open the gallery, pick a template, and build in minutes.
          </p>
          <Button size="lg" asChild>
            <Link href="/templates">
              Browse templates
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
