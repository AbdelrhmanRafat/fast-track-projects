'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * ScrollToTop component that scrolls the page to top on route changes.
 * This ensures content is never hidden under the mobile bottom navigation.
 */
export function ScrollToTop() {
  const pathname = usePathname();
  const scrollContainerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Find the scrollable container (mobile content area)
    const mobileScrollContainer = document.querySelector('[data-scroll-container="mobile"]');
    const desktopScrollContainer = document.querySelector('[data-scroll-container="desktop"]');
    
    // Scroll both containers to top
    if (mobileScrollContainer) {
      mobileScrollContainer.scrollTo({ top: 0, behavior: 'instant' });
    }
    
    if (desktopScrollContainer) {
      desktopScrollContainer.scrollTo({ top: 0, behavior: 'instant' });
    }
    
    // Also scroll window to top as fallback
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}
