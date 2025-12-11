'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { Home, Plus, LogOut, MoreHorizontal, Clock, List, Users } from 'lucide-react';
import { useTranslation } from '@/components/providers/LanguageProvider';
import { getUserData } from '@/lib/cookies';
import { logout } from '@/lib/services/auth/services';
import { UserRole } from '@/lib/types/userRoles';
import { cn } from '@/lib/utils';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

interface NavItem {
  labelKey: string;
  href: string;
  icon: React.ElementType;
  allowedRoles?: UserRole[];
}

// Primary navigation items (shown directly in bottom bar)
const primaryNavItems: NavItem[] = [
  {
    labelKey: 'sidebar.home',
    href: '/home',
    icon: Home,
  },
  {
    labelKey: 'sidebar.createOrder',
    href: '/create-order',
    icon: Plus,
    allowedRoles: [UserRole.Admin, UserRole.SubAdmin, UserRole.Engineering, UserRole.Site],
  },
  {
    labelKey: 'sidebar.currentOrders',
    href: '/orders/current',
    icon: Clock,
  },
];

// Secondary navigation items (shown in "More" menu)
const secondaryNavItems: NavItem[] = [
  {
    labelKey: 'sidebar.allOrders',
    href: '/orders/all',
    icon: List,
    allowedRoles: [UserRole.Admin, UserRole.SubAdmin],
  },
  {
    labelKey: 'sidebar.userslist',
    href: '/users',
    icon: Users,
    allowedRoles: [UserRole.Admin, UserRole.SubAdmin],
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const fetchUserRole = async () => {
      const userData = await getUserData();
      if (userData?.role) {
        setUserRole(userData.role as UserRole);
      }
    };
    fetchUserRole();
  }, []);

  // Filter items based on user role
  const filterByRole = (items: NavItem[]) => {
    return items.filter(item => {
      if (!item.allowedRoles) return true;
      if (!userRole) return false;
      return item.allowedRoles.includes(userRole);
    });
  };

  const filteredPrimaryItems = useMemo(() => filterByRole(primaryNavItems), [userRole]);
  const filteredSecondaryItems = useMemo(() => filterByRole(secondaryNavItems), [userRole]);
  
  // Check if any secondary items exist to show "More" button
  const hasSecondaryItems = filteredSecondaryItems.length > 0;

  const handleNavigation = (href: string) => {
    setIsMoreOpen(false);
    router.push(href);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setIsMoreOpen(false);
    await logout();
    router.push('/auth/signin');
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === '/home') {
      return pathname === '/home' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Bottom nav container */}
      <div className="bg-background/95 backdrop-blur-lg border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-around h-16 px-2">
          {/* Primary Nav Items */}
          {filteredPrimaryItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full px-2 py-1',
                  'transition-all duration-200 ease-out',
                  'active:scale-95 touch-manipulation',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <div className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-2xl mb-0.5',
                  'transition-all duration-200',
                  active && 'bg-primary/10'
                )}>
                  <Icon 
                    className={cn(
                      'w-5 h-5 transition-transform duration-200',
                      active && 'scale-110'
                    )} 
                    strokeWidth={active ? 2.5 : 2}
                  />
                </div>
                <span className={cn(
                  'text-[10px] font-medium leading-tight truncate max-w-[60px]',
                  active && 'font-semibold'
                )}>
                  {t(item.labelKey as any)}
                </span>
              </button>
            );
          })}

          {/* More Button - Only show if there are secondary items */}
          {hasSecondaryItems && (
            <Drawer open={isMoreOpen} onOpenChange={setIsMoreOpen}>
              <DrawerTrigger asChild>
                <button
                  className={cn(
                    'flex flex-col items-center justify-center flex-1 h-full px-2 py-1',
                    'transition-all duration-200 ease-out',
                    'active:scale-95 touch-manipulation',
                    isMoreOpen ? 'text-primary' : 'text-muted-foreground'
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
                  {filteredSecondaryItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    
                    return (
                      <button
                        key={item.href}
                        onClick={() => handleNavigation(item.href)}
                        className={cn(
                          'flex items-center w-full px-5 py-4 rounded-2xl',
                          'transition-all duration-200 active:scale-[0.98]',
                          active 
                            ? 'bg-primary/10 text-primary' 
                            : 'bg-muted/50 text-foreground hover:bg-muted'
                        )}
                      >
                        <Icon className="w-5 h-5 ml-4" strokeWidth={active ? 2.5 : 2} />
                        <span className={cn('text-base font-medium', active && 'font-semibold')}>
                          {t(item.labelKey as any)}
                        </span>
                      </button>
                    );
                  })}
                  
                  {/* Divider */}
                  <div className="h-px bg-border my-5" />
                  
                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className={cn(
                      'flex items-center w-full px-5 py-4 rounded-2xl',
                      'transition-all duration-200 active:scale-[0.98]',
                      'bg-destructive/10 text-destructive hover:bg-destructive/20',
                      isLoggingOut && 'opacity-50 cursor-not-allowed'
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
