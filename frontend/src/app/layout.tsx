import type { Metadata } from 'next';
import './globals.css';
import AppLayout from '../components/layout/app-layout';
import { Toaster } from 'sonner';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../components/providers/theme-provider';

export const metadata: Metadata = {
  title: {
    default: 'SkillPaper - Resume Builder',
    template: '%s | SkillPaper',
  },
  description:
    'Create professional, ATS-friendly resumes with live template previews and a guided builder.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <AppLayout>{children}</AppLayout>
            <Toaster
              position="top-center"
              expand={false}
              richColors
              closeButton
              toastOptions={{
                className: 'mt-[max(0.5rem,env(safe-area-inset-top))] sm:mt-0',
              }}
              offset="72px"
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
