'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/components/providers/LanguageProvider';
import { HelpCircle, Settings } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { sidebarConfig, SidebarItem } from '@/lib/sideBarConfig/sidebar';
import { UserRole } from '@/lib/types/userRoles';
import { resolveIcon, isItemActive, filterSidebarByRole } from '@/lib/sideBarConfig/sidebarUtils';
import { cn } from '@/lib/utils';
import { useNavigationLoadingStore } from '@/stores/navigationLoadingStore';
import { getUserData } from '@/lib/cookies';

export function CompactSidebar() {
  const { t, language } = useTranslation();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const { isNavigating, startNavigation } = useNavigationLoadingStore();

  useEffect(() => {
    setMounted(true);
    // Fetch user role on mount
    const fetchUserRole = async () => {
      const userData = await getUserData();
      if (userData?.role) {
        setUserRole(userData.role as UserRole);
      }
    };
    fetchUserRole();
  }, []);

  // Flatten all top-level items from sidebar config (skip children for compact view)
  // Apply role-based filtering
  const getTopLevelItems = (): SidebarItem[] => {
    const filteredConfig = filterSidebarByRole(sidebarConfig, userRole);
    const items: SidebarItem[] = [];
    filteredConfig.forEach(group => {
      group.items.forEach(item => {
        // Only include items with direct href (no nested menus in compact view)
        if (item.href) {
          items.push(item);
        } else if (item.children && item.children.length > 0) {
          // For items with children, use the first child's href or the parent
          items.push(item);
        }
      });
    });
    return items;
  };

  const topLevelItems = getTopLevelItems();

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (isNavigating) {
      e.preventDefault();
      return;
    }
    
    // Only start navigation if clicking a different route
    if (href && href !== '#' && href !== pathname) {
      startNavigation();
    }
  };

  const renderNavItem = (item: SidebarItem, index: number) => {
    const Icon = resolveIcon(item.icon);
    const active = isItemActive(item, pathname);
    const href = item.href || (item.children?.[0]?.href) || '#';
    const label = t(item.labelKey as any);

    return (
      <TooltipProvider key={`${item.labelKey}-${index}`} delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={href}
              onClick={(e) => handleLinkClick(e, href)}
              className={cn(
                'flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-lg transition-all duration-200 group',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                isNavigating && 'pointer-events-none opacity-50'
              )}
            >
              {Icon && <Icon className="h-5 w-5 shrink-0" />}
              <span className="text-[10px] font-medium leading-tight text-center break-words hyphens-auto max-w-full px-0.5">
                {label}
              </span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side={language === 'ar' ? 'left' : 'right'} className="font-medium">
            {label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  if (!mounted) {
    return (
      <aside className="hidden lg:flex flex-col w-24 bg-sidebar border-e border-border h-screen">
        <div className="h-14 flex items-center justify-center border-b border-border">
          <Image
            src="/app-logo.svg"
            alt="Fast Track Purchasing"
            width={56}
            height={56}
            className="h-14 w-14 object-contain"
            priority
          />
        </div>
      </aside>
    );
  }

  return (
    <aside className="hidden lg:flex flex-col w-24 bg-sidebar border-e border-border h-screen">
      {/* Logo */}
      <div className="h-14 flex items-center justify-center border-b border-border shrink-0">
        <Link 
          href="/home" 
          onClick={(e) => handleLinkClick(e, '/home')}
          className={`flex items-center justify-center hover:opacity-80 transition-opacity ${isNavigating ? 'pointer-events-none opacity-50' : ''}`}
        >
          <Image
            src="/app-logo.svg"
            alt="Fast Track Purchasing"
            width={56}
            height={56}
            className="h-14 w-14 object-contain"
            priority
          />
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <div className="flex flex-col gap-1">
          {topLevelItems.map((item, index) => renderNavItem(item, index))}
        </div>
      </nav>

      {/* Footer Actions */}
      <div className="border-t border-border p-2 shrink-0">
        <div className="flex flex-col gap-1">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/help"
                  onClick={(e) => handleLinkClick(e, '/help')}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-lg transition-all duration-200 text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    isNavigating && 'pointer-events-none opacity-50'
                  )}
                >
                  <HelpCircle className="h-5 w-5" />
                  <span className="text-[10px] font-medium leading-tight text-center break-words">
                    {t('form.help')}
                  </span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side={language === 'ar' ? 'left' : 'right'} className="font-medium">
                {t('form.help')}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/settings/system"
                  onClick={(e) => handleLinkClick(e, '/settings/system')}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-lg transition-all duration-200 text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    isNavigating && 'pointer-events-none opacity-50'
                  )}
                >
                  <Settings className="h-5 w-5" />
                  <span className="text-[10px] font-medium leading-tight text-center break-words">
                    {t('common.settings')}
                  </span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side={language === 'ar' ? 'left' : 'right'} className="font-medium">
                {t('common.settings')}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </aside>
  );
}
