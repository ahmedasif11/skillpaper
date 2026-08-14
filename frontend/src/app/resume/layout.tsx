import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Resume builder',
  description: 'Fill in your details and preview your SkillPaper resume.',
};

export default function ResumeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
