'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import {
  getPageHeaderRouteConfig,
  defaultPageHeaderConfig,
  type PageHeaderRouteConfig,
} from '@/lib/pageHeaderConfig/pageHeaderRouteConfig';

interface RouteBasedPageHeaderProps {
  /** Override the automatic route-based configuration */
  overrideConfig?: Partial<PageHeaderRouteConfig>;
  /** Additional class name for the container */
  className?: string;
  /** Custom click handler for primary action (overrides href navigation) */
  onPrimaryActionClick?: () => void;
  /** Whether to enable animations */
  enableAnimations?: boolean;
  /** Optional description text (overrides descriptionKey from config) */
  description?: string;
  /** Custom title text (overrides titleKey from config) */
  customTitle?: string;
}

/**
 * Route-Based Page Header Component
 * 
 * Automatically adjusts its design (title, layout, visibility of actions, etc.)
 * based on the current path using the pageHeaderRouteConfig.
 * 
 * All configuration is centralized in:
 * src/lib/pageHeaderConfig/pageHeaderRouteConfig.ts
 * 
 * Uses translation keys from ar.json for localization.
 */
export function RouteBasedPageHeader({
  overrideConfig,
  className,
  onPrimaryActionClick,
  enableAnimations = true,
  description,
  customTitle,
}: RouteBasedPageHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();

  // Get configuration for current route
  const routeConfig = getPageHeaderRouteConfig(pathname);
  const config: PageHeaderRouteConfig = {
    ...defaultPageHeaderConfig,
    ...routeConfig,
    ...overrideConfig,
  };

  // Don't render if header should be hidden
  if (config.showHeader === false) {
    return null;
  }

  // Get translated title and description
  const title = customTitle || t(config.titleKey as any);
  const descriptionText = description || (config.descriptionKey ? t(config.descriptionKey as any) : undefined);

  // Handle primary action click
  const handlePrimaryActionClick = () => {
    if (onPrimaryActionClick) {
      onPrimaryActionClick();
    } else if (config.primaryAction?.href) {
      router.push(config.primaryAction.href);
    }
  };

  return (
    <div className={cn('', className)}>
      <div className="flex pt-3 lg:pt-1 flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-5">
        {/* Title and Description */}
        <div className="flex-1 min-w-0">
          <h1
            className={cn(
              'text-xl md:text-2xl font-semibold tracking-tight',
              'text-primary',
              'leading-tight',
              enableAnimations && 'animate-fade-in-down'
            )}
          >
            {title}
          </h1>
          {descriptionText && (
            <p
              className={cn(
                'mt-2 text-sm md:text-base text-muted-foreground',
                'leading-relaxed',
                enableAnimations && 'animate-fade-in-down'
              )}
              style={enableAnimations ? { animationDelay: '0.1s' } : {}}
            >
              {descriptionText}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Secondary actions */}
          {config.secondaryActions && config.secondaryActions.length > 0 && (
            <>
              {config.secondaryActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'ghost'}
                  size="sm"
                  onClick={() => action.href && router.push(action.href)}
                  className={cn(
                    'gap-2 font-medium',
                    enableAnimations && 'animate-fade-in-up',
                    action.className
                  )}
                  style={enableAnimations ? { animationDelay: `${0.2 + index * 0.05}s` } : {}}
                >
                  {action.icon && <action.icon className="h-4 w-4" strokeWidth={2} />}
                  {t(action.labelKey as any)}
                </Button>
              ))}
            </>
          )}

          {/* Primary action button */}
          {config.primaryAction && (
            <Button
              variant={config.primaryAction.variant || 'default'}
              size="sm"
              onClick={handlePrimaryActionClick}
              className={cn(
                'gap-2 font-medium',
                enableAnimations && 'animate-fade-in-up',
                config.primaryAction.className
              )}
              style={enableAnimations ? { animationDelay: '0.3s' } : {}}
            >
              {config.primaryAction.icon && (
                <config.primaryAction.icon className="h-4 w-4" strokeWidth={2} />
              )}
              {t(config.primaryAction.labelKey as any)}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default RouteBasedPageHeader;