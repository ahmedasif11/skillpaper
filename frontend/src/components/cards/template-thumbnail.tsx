'use client';

import { useEffect, useRef, useState } from 'react';
import { ResumePreview } from './resume-preview';
import { SAMPLE_RESUME_DATA } from '@/lib/sampleResumeData';
import { Template } from '@/types';

/** A4 preview size used by ResumePreview iframe (px at 96dpi) */
const PREVIEW_WIDTH = 794;
const PREVIEW_HEIGHT = 1122;

interface TemplateThumbnailProps {
  template: Pick<Template, 'title' | 'thumbnail' | 'html'>;
  /** Visible frame height for gallery cards (clips the page, does not shrink it) */
  heightClassName?: string;
  /** Optional scale override; otherwise fit container width */
  scale?: number;
  /**
   * When true (default), clip to the frame and show the top of the page.
   * When false, fit width and grow height (for detail scroll containers).
   */
  clip?: boolean;
  className?: string;
}

/**
 * Renders a live mini-preview of a resume template using sample data.
 * Falls back to the static thumbnail image when HTML is unavailable.
 */
export function TemplateThumbnail({
  template,
  heightClassName = 'h-[32rem]',
  scale: scaleOverride,
  clip = true,
  className = '',
}: TemplateThumbnailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(scaleOverride ?? 0.5);

  useEffect(() => {
    if (scaleOverride != null) {
      setScale(scaleOverride);
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    const updateScale = () => {
      const width = el.clientWidth;
      if (width <= 0) return;
      // Fit width so body text stays readable; gallery cards clip the bottom.
      setScale(width / PREVIEW_WIDTH);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(el);
    return () => observer.disconnect();
  }, [scaleOverride]);

  if (!template.html) {
    return (
      <div
        className={`relative overflow-hidden bg-muted ${clip ? heightClassName : ''} ${className}`}
      >
        <img
          src={template.thumbnail}
          alt={template.title}
          className={
            clip
              ? 'h-full w-full object-cover object-top'
              : 'w-full h-auto object-contain object-top'
          }
        />
      </div>
    );
  }

  const scaledHeight = PREVIEW_HEIGHT * scale;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-white ${clip ? heightClassName : ''} ${className}`}
      style={clip ? undefined : { height: scaledHeight }}
      aria-hidden={clip || undefined}
    >
      <div
        className="pointer-events-none absolute left-0 top-0 origin-top-left"
        style={{
          width: PREVIEW_WIDTH,
          height: PREVIEW_HEIGHT,
          transform: `scale(${scale})`,
        }}
      >
        <ResumePreview
          data={SAMPLE_RESUME_DATA as any}
          template={template as Template}
          variant="thumbnail"
        />
      </div>
      {clip && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent" />
      )}
    </div>
  );
}
