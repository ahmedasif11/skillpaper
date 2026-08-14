'use client';

import { Badge } from '@/components/ui/badge';
import { ParseStatus } from '@/types';
import {
  CheckCircle2,
  Clock,
  Loader2,
  Shield,
  ShieldAlert,
  XCircle,
} from 'lucide-react';

const STATUS_COPY: Record<
  ParseStatus,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  ready: {
    label: 'Ready to use',
    className:
      'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
    icon: CheckCircle2,
  },
  parsing: {
    label: 'Parsing...',
    className:
      'border-transparent bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
    icon: Loader2,
  },
  scanning: {
    label: 'Scanning for safety...',
    className:
      'border-transparent bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
    icon: Shield,
  },
  uploaded: {
    label: 'Queued...',
    className: 'border-transparent bg-muted text-muted-foreground',
    icon: Clock,
  },
  'failed:parse': {
    label: 'Parse failed',
    className:
      'border-transparent bg-destructive/15 text-destructive',
    icon: XCircle,
  },
  'failed:scan': {
    label: 'Security threat detected',
    className:
      'border-transparent bg-destructive/15 text-destructive',
    icon: ShieldAlert,
  },
};

interface ParseStatusBadgeProps {
  status: ParseStatus;
  className?: string;
}

export function ParseStatusBadge({ status, className }: ParseStatusBadgeProps) {
  const config = STATUS_COPY[status] || STATUS_COPY.uploaded;
  const Icon = config.icon;
  const spin = status === 'parsing' || status === 'scanning';

  return (
    <Badge className={`${config.className} ${className || ''}`}>
      <Icon className={spin ? 'animate-spin' : ''} aria-hidden />
      {config.label}
    </Badge>
  );
}
