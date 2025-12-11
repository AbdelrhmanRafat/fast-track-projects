import { LucideIcon } from 'lucide-react';
import { SidebarItem, SidebarGroup, ICON_REGISTRY, COLOR_CLASSES, ThemeKey, UserRole } from './sidebar';

/**
 * Resolves icon from string name or returns the icon component directly
 */
export function resolveIcon(icon: LucideIcon | string): LucideIcon | null {
  if (typeof icon === 'string') {
    return ICON_REGISTRY[icon] || null;
  }
  return icon;
}

/**
 * Gets theme colors for a specific theme key
 */
export function getThemeColors(theme: ThemeKey) {
  return COLOR_CLASSES[theme];
}

/**
 * Checks if the current pathname exactly matches the item's href
 * Uses exact matching to prevent parent paths from being highlighted
 */
export function isItemActive(
  item: SidebarItem, 
  pathname: string | null
): boolean {
  if (!pathname) return false;

  // Exact match only - no parent path highlighting
  if (item.href) {
    // Normalize paths by removing trailing slashes for comparison
    const normalizedPathname = pathname.replace(/\/$/, '');
    const normalizedHref = item.href.replace(/\/$/, '');
    return normalizedPathname === normalizedHref;
  }

  return false;
}

/**
 * Checks if any child of an item is active (for parent highlighting)
 */
export function hasActiveChild(
  item: SidebarItem,
  pathname: string | null
): boolean {
  if (!pathname || !item.children) return false;
  return item.children.some(child => isItemActive(child, pathname));
}

/**
 * Flattens all items including nested children to find all hrefs
 */
export function getAllItemHrefs(item: SidebarItem): string[] {
  const hrefs: string[] = [];
  
  if (item.href) {
    hrefs.push(item.href);
  }
  
  if (item.children) {
    item.children.forEach(child => {
      hrefs.push(...getAllItemHrefs(child));
    });
  }
  
  return hrefs;
}

/**
 * Generates a unique key for an item (for React keys)
 */
export function getItemKey(item: SidebarItem, index: number): string {
  return item.href || `item-${item.labelKey}-${index}`;
}

/**
 * Checks if an item is accessible by a given user role
 * If allowedRoles is not defined, the item is accessible by all roles
 */
export function isItemAccessibleByRole(
  item: SidebarItem | SidebarGroup,
  userRole: UserRole | null
): boolean {
  // If no allowedRoles defined, accessible by all
  if (!item.allowedRoles || item.allowedRoles.length === 0) {
    return true;
  }
  
  // If user role is not available, deny access
  if (!userRole) {
    return false;
  }
  
  // Check if user role is in the allowed roles
  return item.allowedRoles.includes(userRole);
}

/**
 * Filters a sidebar item and its children based on user role
 * Returns null if the item is not accessible
 */
export function filterItemByRole(
  item: SidebarItem,
  userRole: UserRole | null
): SidebarItem | null {
  // Check if the item itself is accessible
  if (!isItemAccessibleByRole(item, userRole)) {
    return null;
  }
  
  // If item has children, filter them too
  if (item.children && item.children.length > 0) {
    const filteredChildren = item.children
      .map(child => filterItemByRole(child, userRole))
      .filter((child): child is SidebarItem => child !== null);
    
    // If all children are filtered out, return null
    if (filteredChildren.length === 0) {
      return null;
    }
    
    return {
      ...item,
      children: filteredChildren,
    };
  }
  
  return item;
}

/**
 * Filters sidebar groups and their items based on user role
 * Returns only groups and items that are accessible to the user
 */
export function filterSidebarByRole(
  groups: SidebarGroup[],
  userRole: UserRole | null
): SidebarGroup[] {
  return groups
    .filter(group => isItemAccessibleByRole(group, userRole))
    .map(group => {
      const filteredItems = group.items
        .map(item => filterItemByRole(item, userRole))
        .filter((item): item is SidebarItem => item !== null);
      
      return {
        ...group,
        items: filteredItems,
      };
    })
    .filter(group => group.items.length > 0);
}

/**
 * Gets all allowed routes for a given user role from the sidebar config
 */
export function getAllowedRoutesForRole(
  groups: SidebarGroup[],
  userRole: UserRole | null
): string[] {
  const filteredGroups = filterSidebarByRole(groups, userRole);
  const routes: string[] = [];
  
  filteredGroups.forEach(group => {
    group.items.forEach(item => {
      routes.push(...getAllItemHrefs(item));
    });
  });
  
  return routes;
}