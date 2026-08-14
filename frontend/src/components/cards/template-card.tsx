import { Card, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Crown } from 'lucide-react';
import { TemplateThumbnail } from './template-thumbnail';
import Link from 'next/link';

interface TemplateCardProps {
  template: {
    id: string;
    title: string;
    description: string;
    category: string;
    thumbnail: string;
    isPro: boolean;
    html?: string;
  };
  onUseTemplate: (templateId: string) => void;
  onViewDetails: (templateId: string) => void;
}

export function TemplateCard({
  template,
  onUseTemplate,
  onViewDetails,
}: TemplateCardProps) {
  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      <CardContent className="p-0 flex-1">
        <div className="relative overflow-hidden">
          <TemplateThumbnail
            template={template}
            heightClassName="h-64 sm:h-72 lg:h-80"
            className="rounded-t-xl"
          />
          {template.isPro && (
            <Badge
              variant="secondary"
              className="absolute top-2 right-2 bg-primary text-primary-foreground border-0 z-10 pointer-events-none"
            >
              <Crown className="w-3 h-3 mr-1" />
              PRO
            </Badge>
          )}
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors rounded-t-xl pointer-events-none z-[1]" />
        </div>
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-semibold leading-tight min-w-0 break-words">
              {template.title}
            </h3>
            <Badge variant="outline" className="text-xs shrink-0">
              {template.category}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {template.description}
          </p>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-3 flex flex-col xs:flex-row sm:flex-row gap-2">
        <Button variant="outline" size="sm" className="w-full sm:flex-1" asChild>
          <Link href={`/templates/${template.id}`}>Preview</Link>
        </Button>
        <Button
          size="sm"
          className="w-full sm:flex-1"
          onClick={() => onUseTemplate(template.id)}
        >
          Use Template
        </Button>
      </CardFooter>
    </Card>
  );
}
