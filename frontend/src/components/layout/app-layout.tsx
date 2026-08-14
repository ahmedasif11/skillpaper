'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './navbar';
import { Footer } from './footer';
import { useAuthContext } from '../../contexts/AuthContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthContext();
  const pathname = usePathname();
  const isTemplateDetail = /^\/templates\/[^/]+$/.test(pathname);
  const isResumeForm = pathname.startsWith('/resume/form');

  return (
    <div className="min-h-svh bg-background flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <Navbar user={user} onLogout={logout} />
      <main id="main-content" className="flex-1" tabIndex={-1}>
        {children}
      </main>
      <Footer
        className={
          isTemplateDetail
            ? 'max-lg:pb-[calc(5.5rem+env(safe-area-inset-bottom))]'
            : isResumeForm
              ? 'max-sm:hidden'
              : undefined
        }
      />
    </div>
  );
}
