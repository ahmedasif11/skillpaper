import type { Metadata } from 'next';
import './globals.css';
import AppLayout from '../components/layout/app-layout';
import { Toaster } from 'sonner';
import { AuthProvider } from '../contexts/AuthContext';

export const metadata: Metadata = {
  title: 'SkillPaper - Resume Builder',
  description:
    'Create professional resumes with our easy-to-use resume builder',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AppLayout>{children}</AppLayout>
          <Toaster
            position="top-right"
            expand={true}
            richColors={true}
            closeButton={true}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
