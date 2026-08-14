'use client';

import { useEffect, useRef, useState } from 'react';
import { ResumePreview } from './resume-preview';
import { Template } from '@/types';

const PREVIEW_WIDTH = 794;
const PREVIEW_HEIGHT = 1122;

interface ScaledResumePreviewProps {
  data: any;
  template: Template | null;
  className?: string;
}

export function ScaledResumePreview({
  data,
  template,
  className = '',
}: ScaledResumePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateScale = () => {
      const width = el.clientWidth;
      if (width <= 0) return;
      setScale(Math.min(1, width / PREVIEW_WIDTH));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scaledHeight = PREVIEW_HEIGHT * scale;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-white w-full max-w-full ${className}`}
      style={{ height: scaledHeight }}
    >
      <div
        className="pointer-events-none absolute left-0 top-0 origin-top-left"
        style={{
          width: PREVIEW_WIDTH,
          height: PREVIEW_HEIGHT,
          transform: `scale(${scale})`,
        }}
      >
        <ResumePreview data={data} template={template} variant="thumbnail" />
      </div>
    </div>
  );
}
