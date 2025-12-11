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
import { useTranslation } from 'next-intl';
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
          transition:.message truncated