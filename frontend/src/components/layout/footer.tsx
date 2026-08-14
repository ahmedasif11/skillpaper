'use client';

import Link from 'next/link';
import { FileText } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';
import { cn } from '../ui/utils';

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const year = new Date().getFullYear();
  const { user } = useAuthContext();

  return (
    <footer
      className={cn(
        'border-t border-border bg-background mt-auto',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" aria-hidden />
            <span className="font-semibold">SkillPaper</span>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </Link>
            <Link
              href="/templates"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Templates
            </Link>
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
            {!user && (
              <Link
                href="/login"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
            )}
          </nav>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          © {year} SkillPaper. Build professional, ATS-friendly resumes.
        </p>
      </div>
    </footer>
  );
}
