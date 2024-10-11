'use client';

import { useEffect, useRef, useState } from 'react';

interface StickyDateProps {
  date: string;
  title: string;
  index: number;
}

export function StickyDate({ date, title, index }: StickyDateProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [showTitle, setShowTitle] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowTitle(!entry.isIntersecting);
      },
      { rootMargin: '-100px 0px 0px 0px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return (
    <div className="sticky top-5 transition-transform duration-300 md:pr-4">
      <div ref={ref} className="text-sm font-medium">
        {date}
      </div>
      {showTitle && (
        <div className="text-xs font-semibold mt-2 text-muted-foreground hidden md:block">
          {title}
        </div>
      )}
    </div>
  );
}

