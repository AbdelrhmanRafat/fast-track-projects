'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, 
  Sun,
  Moon,
  LogOut
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from 'next-themes';
import { buildBreadcrumbTrail } from '@/lib/BreadCrumbRouteConfig/routeConfig';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useEffect } from 'react';
import { logout } from '@/lib/services/auth/services';
import { NotificationBell } from '@/components/ui/NotificationBell';

interface CompactTopBarProps {
  className?: string;
}

export function CompactTopBar({ className }: CompactTopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    await logout();
    router.push('/auth/signin');
    router.refresh();
  };

  const getThemeIcon = () => {
    if (!mounted) return <Sun className="h-4 w-4" />;
    return theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />;
  };

  // Build breadcrumb trail based on current path
  const breadcrumbTrail = buildBreadcrumbTrail(pathname);

  return (
    <div className={`hidden lg:flex items-center justify-between h-14 px-4 bg-sidebar border-b border-border ${className || ''}`}>
      {/* Left - Breadcrumb */}
      <div className="flex-1 min-w-0">
        {pathname === '/home' || breadcrumbTrail.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Home className="h-4 w-4" />
            <span className="font-medium">{t('common.home')}</span>
          </div>
        ) : (
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
              <BreadcrumbSeparator className="rotate-180" />

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
                        <BreadcrumbPage className="font-medium">
                          {t(item.titleKey as any)}
                        </BreadcrumbPage>
                      ) : (
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
                    {!isLast && (
                      <BreadcrumbSeparator className="rotate-180" />
                    )}
                  </React.Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        )}
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications - Using PWA Badge Component */}
        <NotificationBell 
          className="h-9 w-9 hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground"
        />

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground flex items-center justify-center"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {getThemeIcon()}
          <span className="sr-only">{t('navbar.theme')}</span>
        </Button>

        {/* User Avatar Dropdown - Only Logout */}
        <DropdownMenu dir="rtl">
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hover:bg-accent/50 transition-colors p-0 rounded-full flex items-center justify-center"
            >
              <Avatar className="h-7 w-7 ring-2 ring-border hover:ring-primary/50 transition-all">
                <AvatarImage src="" alt="User" />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-xs font-semibold">
                  U
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span>{isLoggingOut ? 'جاري تسجيل الخروج...' : t('sidebar.logout')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
