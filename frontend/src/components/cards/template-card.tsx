import { Card, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Crown } from 'lucide-react';
import { TemplateThumbnail } from './template-thumbnail';

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
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      <CardContent className="p-0">
        <div className="relative">
          <TemplateThumbnail
            template={template}
            heightClassName="h-[32rem]"
            className="rounded-t-lg"
          />
          {template.isPro && (
            <Badge
              variant="secondary"
              className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 z-10"
            >
              <Crown className="w-3 h-3 mr-1" />
              PRO
            </Badge>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-t-lg pointer-events-none z-[1]" />
        </div>
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="font-semibold">{template.title}</h3>
            <Badge variant="outline" className="text-xs">
              {template.category}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {template.description}
          </p>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-3 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onViewDetails(template.id)}
        >
          Preview
        </Button>
        <Button
          size="sm"
          className="flex-1"
          onClick={() => onUseTemplate(template.id)}
        >
          Use Template
        </Button>
      </CardFooter>
    </Card>
  );
}
