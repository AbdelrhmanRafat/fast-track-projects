'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { buildBreadcrumbTrail } from '@/lib/BreadCrumbRouteConfig/routeConfig';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface SharedBreadCrumbProps {
  className?: string;
}

export function SharedBreadCrumb({ className }: SharedBreadCrumbProps) {
  const pathname = usePathname();
  const { t, language } = useTranslation();

  // Build breadcrumb trail based on current path
  const breadcrumbTrail = buildBreadcrumbTrail(pathname);

  // Don't render breadcrumb on home page or if trail is empty
  if (pathname === '/home' || breadcrumbTrail.length === 0) {
    return null;
  }

  return (
    <div 
      className={`border-b ${className || ''}`}
    >
      <div className="w-full rounded-2xl lg:bg-card bg-background px-3 py-3">
        <Breadcrumb>
          <BreadcrumbList>
            {/* Home icon as first item */}
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link 
                  href="/home" 
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Home className="h-4 w-4" />
                  <span className="sr-only">{t('common.home')}</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>

            {/* Separator after home */}
            <BreadcrumbSeparator className={language === 'ar' ? 'rotate-180' : ''} />

            {/* Dynamic breadcrumb items */}
            {breadcrumbTrail.map((item, index) => {
              const isLast = index === breadcrumbTrail.length - 1;
              
              // Skip home in the trail since we already show it as icon
              if (item.path === '/home') {
                return null;
              }

              return (
                <React.Fragment key={item.path}>
                  <BreadcrumbItem>
                    {isLast ? (
                      // Current page - not a link
                      <BreadcrumbPage className="font-medium">
                        {t(item.titleKey as any)}
                      </BreadcrumbPage>
                    ) : (
                      // Parent pages - clickable links
                      <BreadcrumbLink asChild>
                        <Link 
                          href={item.path}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {t(item.titleKey as any)}
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>

                  {/* Add separator between items (but not after the last one) */}
                  {!isLast && (
                    <BreadcrumbSeparator className={language === 'ar' ? 'rotate-180' : ''} />
                  )}
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );
}

export default SharedBreadCrumb;
