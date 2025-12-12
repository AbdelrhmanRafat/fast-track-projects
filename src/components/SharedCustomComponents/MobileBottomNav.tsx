'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { LogOut, MoreHorizontal } from 'lucide-react';
import { useTranslation } from '@/components/providers/LanguageProvider';
import { getUserData } from '@/lib/cookies';
import { logout } from '@/lib/services/auth/services';
import { UserRole } from '@/lib/types/userRoles';
import { sidebarConfig, SidebarItem } from '@/lib/sideBarConfig/sidebar';
import { resolveIcon, isItemActive, filterSidebarByRole } from '@/lib/sideBarConfig/sidebarUtils';
import { cn } from '@/lib/utils';
import { useNavigationLoadingStore } from '@/stores/navigationLoadingStore';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { isNavigating, startNavigation } = useNavigationLoadingStore();

  useEffect(() => {
    setMounted(true);
    const fetchUserRole = async () => {
      const userData = await getUserData();
      if (userData?.role) {
        setUserRole(userData.role as UserRole);
      }
    };
    fetchUserRole();
  }, []);

  // Get all top-level items from sidebar config and apply role-based filtering
  const getTopLevelItems = (): SidebarItem[] => {
    const filteredConfig = filterSidebarByRole(sidebarConfig, userRole);
    const items: SidebarItem[] = [];
    filteredConfig.forEach(group => {
      group.items.forEach(item => {
        // Only include items with direct href (no nested menus)
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

  const topLevelItems = useMemo(() => getTopLevelItems(), [userRole]);
  
  // Split items into primary (first 3) and secondary (rest)
  const primaryItems = topLevelItems.slice(0, 3);
  const secondaryItems = topLevelItems.slice(3);
  
  // Check if any secondary items exist to show "More" button
  const hasSecondaryItems = secondaryItems.length > 0;

  const handleNavigation = (href: string) => {
    if (isNavigating) return;
    
    setIsMoreOpen(false);
    
    // Only start navigation if clicking a different route
    if (href && href !== '#' && href !== pathname) {
      startNavigation();
      router.push(href);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setIsMoreOpen(false);
    await logout();
    router.push('/auth/signin');
    router.refresh();
  };

  if (!mounted) {
    return null;
  }

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Bottom nav container */}
      <div className="bg-background/95 backdrop-blur-lg border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-around h-16 px-2">
          {/* Primary Nav Items */}
          {primaryItems.map((item, index) => {
            const Icon = resolveIcon(item.icon);
            const active = isItemActive(item, pathname);
            const href = item.href || (item.children?.[0]?.href) || '#';
            const label = t(item.labelKey as any);
            
            return (
              <button
                key={`${item.labelKey}-${index}`}
                onClick={() => handleNavigation(href)}
                disabled={isNavigating}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full px-2 py-1',
                  'transition-all duration-200 ease-out',
                  'active:scale-95 touch-manipulation',
                  active ? 'text-primary' : 'text-muted-foreground',
                  isNavigating && 'opacity-50 cursor-not-allowed'
                )}
              >
                <div className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-2xl mb-0.5',
                  'transition-all duration-200',
                  active && 'bg-primary/10'
                )}>
                  {Icon && (
                    <Icon 
                      className={cn(
                        'w-5 h-5 transition-transform duration-200',
                        active && 'scale-110'
                      )} 
                      strokeWidth={active ? 2.5 : 2}
                    />
                  )}
                </div>
                <span className={cn(
                  'text-[10px] font-medium leading-tight truncate max-w-[60px]',
                  active && 'font-semibold'
                )}>
                  {label}
                </span>
              </button>
            );
          })}

          {/* More Button - Only show if there are secondary items */}
          {hasSecondaryItems && (
            <Drawer open={isMoreOpen} onOpenChange={setIsMoreOpen}>
              <DrawerTrigger asChild>
                <button
                  disabled={isNavigating}
                  className={cn(
                    'flex flex-col items-center justify-center flex-1 h-full px-2 py-1',
                    'transition-all duration-200 ease-out',
                    'active:scale-95 touch-manipulation',
                    isMoreOpen ? 'text-primary' : 'text-muted-foreground',
                    isNavigating && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <div className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-2xl mb-0.5',
                    'transition-all duration-200',
                    isMoreOpen && 'bg-primary/10'
                  )}>
                    <MoreHorizontal className="w-5 h-5" strokeWidth={isMoreOpen ? 2.5 : 2} />
                  </div>
                  <span className={cn(
                    'text-[10px] font-medium leading-tight',
                    isMoreOpen && 'font-semibold'
                  )}>
                    {t('common.more') || 'More'}
                  </span>
                </button>
              </DrawerTrigger>
              
              <DrawerContent className="pb-safe">
                <DrawerHeader className="pt-6 pb-4">
                  <DrawerTitle className="text-lg font-semibold text-center">
                    {t('common.menu') || 'Menu'}
                  </DrawerTitle>
                </DrawerHeader>
                
                <div className="px-6 pb-8 space-y-3">
                  {/* Secondary Navigation Items */}
                  {secondaryItems.map((item, index) => {
                    const Icon = resolveIcon(item.icon);
                    const active = isItemActive(item, pathname);
                    const href = item.href || (item.children?.[0]?.href) || '#';
                    const label = t(item.labelKey as any);
                    
                    return (
                      <button
                        key={`${item.labelKey}-${index}`}
                        onClick={() => handleNavigation(href)}
                        disabled={isNavigating}
                        className={cn(
                          'flex items-center w-full px-5 py-4 rounded-2xl',
                          'transition-all duration-200 active:scale-[0.98]',
                          active 
                            ? 'bg-primary/10 text-primary' 
                            : 'bg-muted/50 text-foreground hover:bg-muted',
                          isNavigating && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        {Icon && <Icon className="w-5 h-5 ml-4" strokeWidth={active ? 2.5 : 2} />}
                        <span className={cn('text-base font-medium', active && 'font-semibold')}>
                          {label}
                        </span>
                      </button>
                    );
                  })}
                  
                  {/* Divider */}
                  <div className="h-px bg-border my-5" />
                  
                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut || isNavigating}
                    className={cn(
                      'flex items-center w-full px-5 py-4 rounded-2xl',
                      'transition-all duration-200 active:scale-[0.98]',
                      'bg-destructive/10 text-destructive hover:bg-destructive/20',
                      (isLoggingOut || isNavigating) && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <LogOut className="w-5 h-5 ml-4" />
                    <span className="text-base font-medium">
                      {isLoggingOut ? t('common.loggingOut') || 'Logging out...' : t('sidebar.logout')}
                    </span>
                  </button>
                </div>
              </DrawerContent>
            </Drawer>
          )}
        </div>
      </div>
    </nav>
  );
}
