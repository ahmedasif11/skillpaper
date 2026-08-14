import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Templates',
  description: 'Browse live SkillPaper resume templates and start building.',
};

export default function TemplatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
