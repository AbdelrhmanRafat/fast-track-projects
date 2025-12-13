/**
 * Route Configuration for Breadcrumb and Page Metadata
 * 
 * This configuration controls:
 * - Breadcrumb titles and labels
 * - Page titles
 * - Any future metadata related to routes
 */

export interface RouteConfigItem {
  /** Translation key for the page title */
  titleKey: string;
  /** Translation key for the breadcrumb label (defaults to titleKey if not provided) */
  breadcrumbKey?: string;
  /** Parent route path (for building breadcrumb hierarchy) */
  parent?: string;
  /** Whether to show this route in breadcrumb */
  showInBreadcrumb?: boolean;
  /** Icon name from lucide-react (optional) */
  icon?: string;
}

export interface RouteConfig {
  [path: string]: RouteConfigItem;
}

/**
 * Route configuration mapping paths to their metadata
 * Keys should match the exact route path
 */
export const routeConfig: RouteConfig = {
  // Home / Dashboard
  '/home': {
    titleKey: 'sidebar.home',
    showInBreadcrumb: true,
  },

  // Projects
  '/projects/all': {
    titleKey: 'sidebar.allProjects',
    breadcrumbKey: 'sidebar.projects',
    parent: '/home',
    showInBreadcrumb: true,
  },
  '/projects/current': {
    titleKey: 'sidebar.currentProjects',
    parent: '/projects/all',
    showInBreadcrumb: true,
  },
  '/projects/create': {
    titleKey: 'sidebar.createProject',
    parent: '/projects/all',
    showInBreadcrumb: true,
  },
  '/projects/[id]': {
    titleKey: 'projects.projectDetails',
    parent: '/projects/all',
    showInBreadcrumb: true,
  },
  '/projects/[id]/edit': {
    titleKey: 'projects.form.editTitle',
    parent: '/projects/[id]',
    showInBreadcrumb: true,
  },
  '/projects/[id]/assign-project': {
    titleKey: 'projects.editors.title',
    parent: '/projects/[id]',
    showInBreadcrumb: true,
  },

  // Create Order
  '/create-order': {
    titleKey: 'sidebar.createOrder',
    parent: '/home',
    showInBreadcrumb: true,
  },

  // Orders
  '/orders/all': {
    titleKey: 'sidebar.allOrders',
    breadcrumbKey: 'sidebar.orders',
    parent: '/home',
    showInBreadcrumb: true,
  },
  '/orders/current': {
    titleKey: 'sidebar.currentOrders',
    parent: '/orders/all',
    showInBreadcrumb: true,
  },
  '/orders/[id]': {
    titleKey: 'orders.orderDetails',
    parent: '/orders/all',
    showInBreadcrumb: true,
  },
  '/orders/[id]/edit': {
    titleKey: 'orders.form.editTitle',
    parent: '/orders/[id]',
    showInBreadcrumb: true,
  },
  '/orders/[id]/edit-items': {
    titleKey: 'orders.editItems',
    parent: '/orders/[id]',
    showInBreadcrumb: true,
  },

  // Users
  '/users': {
    titleKey: 'sidebar.userslist',
    breadcrumbKey: 'sidebar.users',
    parent: '/home',
    showInBreadcrumb: true,
  },
};

/**
 * Get route configuration for a given path
 * Supports dynamic segments like [id]
 */
export function getRouteConfig(pathname: string): RouteConfigItem | null {
  // First try exact match
  if (routeConfig[pathname]) {
    return routeConfig[pathname];
  }

  // Check for edit project pattern: /projects/[id]/edit
  const editProjectMatch = pathname.match(/^\/projects\/([^/]+)\/edit$/);
  if (editProjectMatch && !['all', 'current', 'create'].includes(editProjectMatch[1])) {
    return routeConfig['/projects/[id]/edit'] || null;
  }

  // Check for assign project pattern: /projects/[id]/assign-project
  const assignProjectMatch = pathname.match(/^\/projects\/([^/]+)\/assign-project$/);
  if (assignProjectMatch && !['all', 'current', 'create'].includes(assignProjectMatch[1])) {
    return routeConfig['/projects/[id]/assign-project'] || null;
  }

  // Check for view project pattern: /projects/[id]
  const viewProjectMatch = pathname.match(/^\/projects\/([^/]+)$/);
  if (viewProjectMatch && !['all', 'current', 'create'].includes(viewProjectMatch[1])) {
    return routeConfig['/projects/[id]'] || null;
  }

  // Check for edit order pattern: /orders/[id]/edit
  const editOrderMatch = pathname.match(/^\/orders\/([^/]+)\/edit$/);
  if (editOrderMatch && !['all', 'current'].includes(editOrderMatch[1])) {
    return routeConfig['/orders/[id]/edit'] || null;
  }

  // Check for view order pattern: /orders/[id]
  const viewOrderMatch = pathname.match(/^\/orders\/([^/]+)$/);
  if (viewOrderMatch && !['all', 'current'].includes(viewOrderMatch[1])) {
    return routeConfig['/orders/[id]'] || null;
  }

  return null;
}

/**
 * Build breadcrumb trail from current path
 * Returns array of breadcrumb items from root to current page
 */
export interface BreadcrumbItem {
  path: string;
  titleKey: string;
  isCurrentPage: boolean;
}

export function buildBreadcrumbTrail(pathname: string): BreadcrumbItem[] {
  const trail: BreadcrumbItem[] = [];
  let currentPath: string | undefined = pathname;

  // Extract order ID from path if present (for dynamic routes)
  const orderIdMatch = pathname.match(/^\/orders\/([^/]+)/);
  const orderId = orderIdMatch && !['all', 'current'].includes(orderIdMatch[1]) ? orderIdMatch[1] : null;

  // Extract project ID from path if present (for dynamic routes)
  const projectIdMatch = pathname.match(/^\/projects\/([^/]+)/);
  const projectId = projectIdMatch && !['all', 'current', 'create'].includes(projectIdMatch[1]) ? projectIdMatch[1] : null;

  // Build trail from current page back to root
  while (currentPath) {
    const config = getRouteConfig(currentPath);
    
    if (config && config.showInBreadcrumb !== false) {
      // Replace [id] placeholder with actual ID in the path
      let actualPath = currentPath;
      if (orderId && currentPath.includes('[id]') && currentPath.startsWith('/orders')) {
        actualPath = currentPath.replace('[id]', orderId);
      }
      if (projectId && currentPath.includes('[id]') && currentPath.startsWith('/projects')) {
        actualPath = currentPath.replace('[id]', projectId);
      }

      trail.unshift({
        path: actualPath,
        titleKey: config.breadcrumbKey || config.titleKey,
        isCurrentPage: currentPath === pathname || actualPath === pathname,
      });
      
      // Get parent path, replacing [id] with actual ID if needed
      let parentPath = config.parent;
      if (parentPath && orderId && parentPath.includes('[id]') && parentPath.startsWith('/orders')) {
        currentPath = parentPath.replace('[id]', orderId);
      } else if (parentPath && projectId && parentPath.includes('[id]') && parentPath.startsWith('/projects')) {
        currentPath = parentPath.replace('[id]', projectId);
      } else {
        currentPath = parentPath;
      }
    } else {
      break;
    }
  }

  return trail;
}
