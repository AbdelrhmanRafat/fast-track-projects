'use client';

import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { LogOut, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/components/providers/LanguageProvider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { logout } from '@/lib/services/auth/services';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const { t } = useTranslation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

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
    if (!mounted) return <Sun className="h-[18px] w-[18px]" />;
    return theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />;
  };

  return (
    <nav className={`bg-background/95 backdrop-blur-lg border-b border-border h-14 flex items-center px-4 sticky top-0 z-40 ${className || ''}`}>
      <div className="flex items-center justify-between w-full">
        {/* Logo */}
        <Link href="/home" className="flex items-center">
          <Image
            src="/app-logo.svg"
            alt="Fast Track Purchasing"
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
            priority
          />
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-1">
          {/* Notifications */}
          <NotificationBell 
            className="h-9 w-9 hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground"
          />

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {getThemeIcon()}
            <span className="sr-only">{t('navbar.theme') || 'Toggle theme'}</span>
          </Button>

          {/* User Avatar Dropdown */}
          <DropdownMenu dir="rtl">
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 hover:bg-accent/50 transition-colors p-0 rounded-full"
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
                <span>{isLoggingOut ? t('common.loggingOut') || 'Logging out...' : t('sidebar.logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
