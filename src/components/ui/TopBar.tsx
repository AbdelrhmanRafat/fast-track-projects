'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

// Configure NProgress
NProgress.configure({
  showSpinner: false, // Hide spinner for cleaner look
  trickleSpeed: 200,  // Speed of progress bar animation
  minimum: 0.1,       // Minimum percentage used upon starting
  easing: 'ease',     // CSS easing animation
  speed: 400,         // Speed of transition
});

/**
 * TopBar Component
 * 
 * A page loading progress bar that automatically shows during route transitions.
 * Uses nprogress library with custom styling to match the global design system.
 * 
 * Features:
 * - Automatic route change detection
 * - Follows design system color variables
 * - Smooth animations
 * - Theme-aware (supports light/dark mode)
 * - No spinner for minimal distraction
 * 
 * @example
 * ```tsx
 * import { TopBar } from '@/components/ui/TopBar';
 * 
 * export default function Layout({ children }) {
 *   return (
 *     <>
 *       <TopBar />
 *       {children}
 *     </>
 *   );
 * }
 * ```
 */
export function TopBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Start progress bar on route change
    NProgress.start();

    // Complete progress bar after a short delay
    const timeout = setTimeout(() => {
      NProgress.done();
    }, 100);

    return () => {
      clearTimeout(timeout);
      NProgress.done();
    };
  }, [pathname, searchParams]);

  return (
    <style jsx global>{`
      /* NProgress Bar Container */
      #nprogress {
        pointer-events: none;
      }

      /* Progress Bar */
      #nprogress .bar {
        position: fixed;
        z-index: 9999;
        top: 0;
        left: 0;
        width: 100%;
        height: 3px;
        box-shadow: 0 0 10px hsl(var(--primary) / 0.5),
                    0 0 5px hsl(var(--primary) / 0.5);
        transition: all 0.3s ease;
        background-color: var(--primary);
      }

      /* Progress Bar Glow Effect */
      #nprogress .peg {
        display: block;
        position: absolute;
        right: 0px;
        width: 100px;
        height: 100%;
        box-shadow: 0 0 10px hsl(var(--primary)),
                    0 0 5px hsl(var(--primary));
        opacity: 1;
        transform: rotate(3deg) translate(0px, -4px);
      }

      /* Remove default spinner */
      #nprogress .spinner {
        display: none;
      }

      /* Fade in/out animation */
      #nprogress .bar {
        animation: nprogress-fade-in 0.2s ease-in;
      }

      @keyframes nprogress-fade-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      /* Theme-specific adjustments for better visibility */
      .dark #nprogress .bar {
        box-shadow: 0 0 12px hsl(var(--primary) / 0.8),
                    0 0 6px hsl(var(--primary) / 0.6);
      }

      .dark #nprogress .peg {
        box-shadow: 0 0 12px hsl(var(--primary)),
                    0 0 6px hsl(var(--primary));
      }
    `}</style>
  );
}