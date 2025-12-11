'use client';

import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '@/components/providers/LanguageProvider';
import { ChevronDown, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useSidebarStore } from '@/stores/sidebarStore';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTheme } from 'next-themes';
import { sidebarConfig, SidebarItem } from '@/lib/sideBarConfig/sidebar';
import { UserRole } from '@/lib/types/userRoles';
import { resolveIcon, isItemActive, filterSidebarByRole } from '@/lib/sideBarConfig/sidebarUtils';
import { useErrorStore } from '@/stores/errorStore';
import { useNavigationLoadingStore } from '@/stores/navigationLoadingStore';
import { getUserData } from '@/lib/cookies';

export function Sidebar() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const { isCollapsed, toggleCollapse } = useSidebarStore();
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

  // Apply role-based filtering to sidebar config
  const filteredSidebarConfig = useMemo(() => {
    return filterSidebarByRole(sidebarConfig, userRole);
  }, [userRole]);

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    filteredSidebarConfig.forEach(group => {
      if (group.expandable) {
        initial[group.titleKey] = true;
      }
    });
    return initial;
  });

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    // try {
    //   const response = await logout();

    //   if (response && response.status === 1) {
    //     // Success - redirect to signin
    //     router.push('/auth/signin');
    //     router.refresh(); // Refresh to clear auth state
    //   } else {
    //     // Show error but still redirect
    //     const errorMessage = response?.message || 'Logout failed';
    //     useErrorStore.getState().showError(errorMessage, 'error');
    //     router.push('/auth/signin');
    //     router.refresh();
    //   }
    // } catch (error: any) {
    //   console.error('Logout failed:', error);
    //   // Even if logout fails, redirect to signin to clear local state
    //   router.push('/auth/signin');
    //   router.refresh();
    // } finally {
    //   setIsLoggingOut(false);
    // }
  };

  const toggleGroup = (titleKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [titleKey]: !prev[titleKey]
    }));
  };

  const toggleItem = (itemKey: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemKey]: !prev[itemKey]
    }));
  };

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

  const renderMenuItem = (item: SidebarItem, index: number, depth: number = 0): React.ReactElement => {
    const Icon = resolveIcon(item.icon);
    const active = isItemActive(item, pathname);
    const itemKey = item.href || `${item.labelKey}-${index}`;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems[itemKey] ?? true;

    if (isCollapsed) {
      const linkHref = hasChildren && item.children && item.children.length > 0
        ? (item.children[0].href || item.href || '#')
        : (item.href || '#');

      return (
        <Tooltip key={itemKey}>
          <TooltipTrigger asChild>
            <Link
              href={linkHref}
              onClick={(e) => handleLinkClick(e, linkHref)}
              className={`flex items-center justify-center h-10 w-10 mx-auto rounded-lg transition-all duration-200 ${active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                } ${isNavigating ? 'pointer-events-none opacity-50' : ''}`}
            >
              {Icon && <Icon className="h-5 w-5 shrink-0" />}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {t(item.labelKey as any)}
          </TooltipContent>
        </Tooltip>
      );
    }

    if (hasChildren) {
      return (
        <div key={itemKey} className="space-y-1">
          <button
            onClick={() => toggleItem(itemKey)}
            className={`w-full flex items-center justify-between h-9 px-3 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 ${active
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            style={{ paddingLeft: `${12 + depth * 20}px` }}
          >
            <div className="flex items-center gap-3">
              {Icon && <Icon className="h-4.5 w-4.5 shrink-0" />}
              <span>{t(item.labelKey as any)}</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'
                }`}
            />
          </button>

          <div
            className={`overflow-hidden transition-all duration-200 ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
          >
            <div className="space-y-1 pt-1 relative">
              {/* Vertical connecting line */}
              <div className="absolute left-[22px] top-0 bottom-0 w-px bg-border" />

              {item.children!.map((child, childIndex) =>
                renderMenuItem(child, childIndex, depth + 1)
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <Link
        key={itemKey}
        href={item.href || '#'}
        onClick={(e) => handleLinkClick(e, item.href || '#')}
        className={`flex items-center gap-3 h-9 px-3 rounded-lg text-sm font-medium transition-all duration-200 relative ${active
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-foreground hover:bg-accent hover:text-accent-foreground'
          } ${isNavigating ? 'pointer-events-none opacity-50' : ''}`}
        style={{ paddingLeft: `${12 + depth * 20}px` }}
      >
        {/* Horizontal connecting line for subitems */}
        {depth > 0 && (
          <div className="absolute left-[22px] top-1/2 -translate-y-1/2 w-3 h-px bg-border" style={{ left: `${22 - depth * 20}px` }} />
        )}
        {Icon && <Icon className="h-4.5 w-4.5 shrink-0" />}
        <span>{t(item.labelKey as any)}</span>
      </Link>
    );
  };

  const renderMobileMenuItem = (item: SidebarItem, index: number, depth: number = 0): React.ReactElement => {
    const Icon = resolveIcon(item.icon);
    const active = isItemActive(item, pathname);
    const itemKey = item.href || `${item.labelKey}-${index}`;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems[itemKey] ?? true;

    if (hasChildren) {
      return (
        <div key={itemKey} className="space-y-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => toggleItem(itemKey)}
              isActive={active}
              className={`h-10 px-3 text-sm font-medium cursor-pointer transition-all duration-200 ${active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              style={{ paddingLeft: `${12 + depth * 20}px` }}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  {Icon && <Icon className="h-5 w-5 shrink-0" />}
                  <span className="truncate">{t(item.labelKey as any)}</span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'
                    }`}
                />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <div
            className={`overflow-hidden transition-all duration-200 ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
          >
            <div className="space-y-1 pt-1 relative">
              {/* Vertical connecting line */}
              <div className="absolute left-[22px] top-0 bottom-0 w-px bg-border" />

              {item.children!.map((child, childIndex) =>
                renderMobileMenuItem(child, childIndex, depth + 1)
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <SidebarMenuItem key={itemKey}>
        <SidebarMenuButton
          asChild
          isActive={active}
          className={`h-10 px-3 text-sm font-medium cursor-pointer transition-all duration-200 relative ${active
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-foreground hover:bg-accent hover:text-accent-foreground'
            } ${isNavigating ? 'pointer-events-none opacity-50' : ''}`}
          style={{ paddingLeft: `${12 + depth * 20}px` }}
        >
          <Link 
            href={item.href || '#'} 
            onClick={(e) => handleLinkClick(e, item.href || '#')}
            className="flex items-center gap-3"
          >
            {/* Horizontal connecting line for subitems */}
            {depth > 0 && (
              <div className="absolute left-[22px] top-1/2 -translate-y-1/2 w-3 h-px bg-border" style={{ left: `${22 - depth * 20}px` }} />
            )}
            {Icon && <Icon className="h-5 w-5 shrink-0" />}
            <span className="truncate">{t(item.labelKey as any)}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        className={`flex-col hidden lg:flex pt-3 ${isCollapsed ? 'w-[72px]' : 'w-64'}`}
        style={{
          transition: 'width 0.2s ease-in-out',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <TooltipProvider delayDuration={0}>
          <SidebarPrimitive className="border-none bg-transparent">
            {/* Logo and Collapse Button */}
            <SidebarHeader className="px-3 py-2">
              <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                {!isCollapsed && (
                  <Link href="/home" className="flex items-center gap-2">
                    <Image
                      src={theme === 'dark' ? '/app-logo.svg' : '/app-logo.svg'}
                      alt="Logo"
                      width={40}
                      height={40}
                      className="h-10 w-10"
                    />
                    <span className="font-semibold text-foreground">Fast Track</span>
                  </Link>
                )}
                <button
                  onClick={toggleCollapse}
                  className={`p-2 rounded-lg hover:bg-accent transition-colors ${isCollapsed ? '' : ''}`}
                  title={isCollapsed ? 'Expand' : 'Collapse'}
                >
                  {isCollapsed ? (
                    <PanelLeftOpen className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <PanelLeftClose className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
              </div>
            </SidebarHeader>

            {/* Navigation Items */}
            <SidebarContent className="px-3">
              {filteredSidebarConfig.map((group, groupIndex) => (
                <SidebarGroup key={group.titleKey || groupIndex}>
                  {!isCollapsed && group.titleKey && (
                    <button
                      onClick={() => toggleGroup(group.titleKey!)}
                      className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                    >
                      <span>{t(group.titleKey as any)}</span>
                      <ChevronDown
                        className={`h-3 w-3 transition-transform duration-200 ${expandedGroups[group.titleKey!] !== false ? 'rotate-0' : '-rotate-90'}`}
                      />
                    </button>
                  )}
                  <SidebarGroupContent
                    className={`space-y-1 ${!isCollapsed && group.titleKey && expandedGroups[group.titleKey!] === false ? 'hidden' : ''}`}
                  >
                    <SidebarMenu>
                      {group.items.map((item, itemIndex) =>
                        renderMenuItem(item, itemIndex)
                      )}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}
            </SidebarContent>

            {/* Logout Button */}
            <SidebarFooter className="px-3 py-4 mt-auto border-t">
              {isCollapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="flex items-center justify-center h-10 w-10 mx-auto rounded-lg text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {isLoggingOut ? t('common.loggingOut' as any) : t('sidebar.logout' as any)}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center gap-3 w-full h-10 px-3 rounded-lg text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-medium">
                    {isLoggingOut ? t('common.loggingOut' as any) : t('sidebar.logout' as any)}
                  </span>
                </button>
              )}
            </SidebarFooter>
          </SidebarPrimitive>
        </TooltipProvider>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {filteredSidebarConfig.flatMap(group => group.items).slice(0, 4).map((item, index) => {
            const Icon = resolveIcon(item.icon);
            const active = isItemActive(item, pathname);
            return (
              <Link
                key={item.href || index}
                href={item.href || '#'}
                className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-colors ${
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {Icon && <Icon className="h-5 w-5 mb-1" />}
                <span className="text-[10px] font-medium truncate max-w-[60px]">
                  {t(item.labelKey as any)}
                </span>
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex flex-col items-center justify-center flex-1 h-full py-2 text-destructive transition-colors disabled:opacity-50"
          >
            <LogOut className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">
              {t('sidebar.logout' as any)}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}