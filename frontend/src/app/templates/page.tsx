'use client';

import { Search } from 'lucide-react';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { TemplateCard } from '../../components/cards/template-card';
import { templatesAPI } from '../../lib/api';
import { transformBackendTemplates } from '../../lib/templateTransform';
import { Template } from '../../types';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import LoadingSpinner from '../../components/common/loading-spinner';
import { getPendingImport } from '../../lib/pendingImport';

export default function TemplatesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);

  useEffect(() => {
    const pending = getPendingImport();
    setPendingLabel(pending?.label || null);
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await templatesAPI.getAll();
      if (response.templates && response.templates.length > 0) {
        setTemplates(transformBackendTemplates(response.templates));
      } else {
        setTemplates([]);
        setError('No templates available. Seed the database to get started.');
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
      setTemplates([]);
      setError('Failed to load templates. Check that the backend is running.');
      toast.error('Failed to load templates.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const categories = [
    'All',
    ...Array.from(new Set(templates.map((t) => t.category).filter(Boolean))),
  ];

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">
            Resume Templates
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            Live previews of every template. Pick one and fill in your details.
          </p>
          {pendingLabel && (
            <p className="mt-4 text-sm rounded-lg border border-border bg-muted/50 px-4 py-3 inline-block">
              After you pick a template, we&apos;ll import “{pendingLabel}” so
              you can review it before saving.
            </p>
          )}
        </div>

        <div className="sticky top-16 z-30 -mx-4 px-4 py-3 mb-8 bg-background/95 backdrop-blur border-b border-border sm:mx-0 sm:px-0 sm:border-0 sm:static sm:bg-transparent sm:backdrop-blur-none">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                aria-label="Search templates"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48" aria-label="Category">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <>
            <div className="mb-6">
              <LoadingSpinner size="sm" text="Loading templates…" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[0, 1, 2, 3, 4, 5].map((key) => (
                <div key={key} className="space-y-3">
                  <Skeleton className="h-64 w-full rounded-xl" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-11 flex-1" />
                    <Skeleton className="h-11 flex-1" />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : error && templates.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-xl">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchTemplates}>Retry</Button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">
                {filteredTemplates.length} template
                {filteredTemplates.length !== 1 ? 's' : ''} found
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 overflow-x-hidden">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onUseTemplate={(id) =>
                    router.push(`/resume/form?template=${id}`)
                  }
                  onViewDetails={(id) => router.push(`/templates/${id}`)}
                />
              ))}
            </div>
            {filteredTemplates.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No templates match your search or filter.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
