import Link from 'next/link';
import { FileText } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100svh-8rem)] flex items-center justify-center px-4 py-16">
      <div className="max-w-md text-center space-y-4">
        <FileText className="h-12 w-12 text-primary mx-auto" aria-hidden />
        <h1 className="text-3xl font-bold">Page not found</h1>
        <p className="text-muted-foreground">
          That page doesn&apos;t exist or the template you requested is no
          longer available.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/">Go home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/templates">Browse templates</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
