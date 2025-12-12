/**
 * Page Header Route Configuration
 *
 * This configuration controls page header behavior based on route:
 * - Title (using translation keys)
 * - Action button visibility and configuration
 * - Header visibility
 *
 * Following the same pattern as BreadCrumbRouteConfig
 */

import {
  Plus,
  type LucideIcon,
} from "lucide-react";

export interface PageHeaderAction {
  /** Translation key for button label */
  labelKey: string;
  /** Route to navigate to when clicked (optional) */
  href?: string;
  /** Icon for the button */
  icon?: LucideIcon;
  /** Button variant */
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "destructive";
  /** Additional class name for the button */
  className?: string;
}

export interface PageHeaderRouteConfig {
  /** Translation key for page title */
  titleKey: string;
  /** Translation key for page description (optional) */
  descriptionKey?: string;
  /** Whether to show the page header */
  showHeader?: boolean;
  /** Primary action button configuration */
  primaryAction?: PageHeaderAction;
  /** Secondary actions (optional) */
  secondaryActions?: PageHeaderAction[];
}

export type PageHeaderRouteConfigMap = {
  [path: string]: PageHeaderRouteConfig;
};

/**
 * Page Header configuration mapping paths to their header settings
 */
export const pageHeaderRouteConfig: PageHeaderRouteConfigMap = {
  // Home / Dashboard
  "/home": {
    titleKey: "pageHeaders.home",
    showHeader: true,
  },

  // Projects - All
  "/projects/all": {
    titleKey: "pageHeaders.allProjects",
    showHeader: true,
    primaryAction: {
      labelKey: "sidebar.createProject",
      href: "/projects/create",
      icon: Plus,
      variant: "default",
    },
  },

  // Projects - Current
  "/projects/current": {
    titleKey: "pageHeaders.currentProjects",
    showHeader: true,
  },

  // Projects - Create
  "/projects/create": {
    titleKey: "pageHeaders.createProject",
    showHeader: true,
  },

  // Create Order
  "/create-order": {
    titleKey: "pageHeaders.createOrder",
    showHeader: true,
  },

  // Orders - All
  "/orders/all": {
    titleKey: "pageHeaders.allOrders",
    showHeader: true,
    primaryAction: {
      labelKey: "orders.createOrder",
      href: "/create-order",
      icon: Plus,
      variant: "default",
    },
  },

  // Orders - Current
  "/orders/current": {
    titleKey: "pageHeaders.currentOrders",
    showHeader: true,
  },

  // Users
  "/users": {
    titleKey: "pageHeaders.users",
    showHeader: true,
  },
};

/**
 * Get page header configuration for a given path
 * Supports dynamic segments like [id]
 */
export function getPageHeaderRouteConfig(
  pathname: string
): PageHeaderRouteConfig | null {
  // First try exact match
  if (pageHeaderRouteConfig[pathname]) {
    return pageHeaderRouteConfig[pathname];
  }

  // Check for edit project pattern: /projects/[id]/edit
  const editProjectMatch = pathname.match(/^\/projects\/([^/]+)\/edit$/);
  if (editProjectMatch && !['all', 'current', 'create'].includes(editProjectMatch[1])) {
    return {
      titleKey: "pageHeaders.editProject",
      showHeader: true,
    };
  }

  // Check for view project pattern: /projects/[id]
  const viewProjectMatch = pathname.match(/^\/projects\/([^/]+)$/);
  if (viewProjectMatch && !['all', 'current', 'create'].includes(viewProjectMatch[1])) {
    return {
      titleKey: "pageHeaders.projectDetails",
      showHeader: true,
    };
  }

  // Check for Projects page pattern: /orders/[id]/Projects
  const ProjectsMatch = pathname.match(/^\/orders\/([^/]+)\/Projects$/);
  if (ProjectsMatch) {
    return {
      titleKey: "pageHeaders.ProjectsStatus",
      showHeader: true,
    };
  }

  // Check for edit order pattern: /orders/[id]/edit
  const editOrderMatch = pathname.match(/^\/orders\/([^/]+)\/edit$/);
  if (editOrderMatch) {
    return {
      titleKey: "pageHeaders.editOrder",
      showHeader: true,
    };
  }

  // Check for view order pattern: /orders/[id]
  const viewOrderMatch = pathname.match(/^\/orders\/([^/]+)$/);
  if (viewOrderMatch && !['all', 'current'].includes(viewOrderMatch[1])) {
    return {
      titleKey: "pageHeaders.orderDetails",
      showHeader: true,
    };
  }

  return null;
}

/**
 * Check if header should be shown for a given path
 */
export function shouldShowHeader(pathname: string): boolean {
  const config = getPageHeaderRouteConfig(pathname);
  return config?.showHeader !== false;
}

/**
 * Default header config for routes not in the config
 */
export const defaultPageHeaderConfig: PageHeaderRouteConfig = {
  titleKey: "common.dashboard",
  showHeader: true,
};
