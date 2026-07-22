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
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const categories = ['All', 'Professional'];

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const response = await templatesAPI.getAll();
        if (response.templates && response.templates.length > 0) {
          const transformedTemplates = transformBackendTemplates(
            response.templates
          );
          setTemplates(transformedTemplates);
        } else {
          toast.error('No templates available. Please seed the database.');
        }
      } catch (err) {
        console.error('Error fetching templates:', err);
        toast.error(
          'Failed to load templates. Please check if backend is running.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen py-8 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto dark:border-white"></div>
            <p className="text-muted-foreground mt-4">Loading templates...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            Resume Templates
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Professional templates designed to help you stand out and land your
            dream job
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
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

        {/* Templates Count */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            {filteredTemplates.length} template
            {filteredTemplates.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Templates Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onUseTemplate={(id) =>
                (window.location.href = `/resume/form?template=${id}`)
              }
              onViewDetails={(id) =>
                (window.location.href = `/templates/${id}`)
              }
            />
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No templates found matching your criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
