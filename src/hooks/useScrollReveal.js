import { useEffect } from 'react';

/**
 * A tiny progressive-enhancement hook for content entering the viewport.
 * Elements remain visible when IntersectionObserver is unavailable or when
 * the user prefers reduced motion. No animation library is required.
 */
export function useScrollReveal() {
  useEffect(() => {
    if (
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return undefined;
    }

    const elements = document.querySelectorAll('[data-reveal]');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;

          entry.target.classList.remove('motion-pending');
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -24px 0px' },
    );

    for (const element of elements) {
      element.classList.add('motion-pending');
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
      for (const element of elements) element.classList.remove('motion-pending');
    };
  }, []);
}
