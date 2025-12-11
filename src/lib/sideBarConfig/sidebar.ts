import {
  Home,
  Users,
  LucideIcon,
  ShoppingCart,
  Plus,
  List,
  Clock,
  Eye,
} from "lucide-react";
import { UserRole } from "@/lib/types/userRoles";

// Re-export UserRole for convenience
export { UserRole };

// TypeScript types for sidebar configuration
export type ThemeKey = "primary";

export interface SidebarItem {
  labelKey: string;
  href?: string;
  icon: LucideIcon | string;
  theme: ThemeKey;
  children?: SidebarItem[];
  /** Roles that can access this item. If undefined, all roles can access */
  allowedRoles?: UserRole[];
}

export interface SidebarGroup {
  titleKey: string;
  items: SidebarItem[];
  expandable?: boolean;
  /** Roles that can see this group. If undefined, all roles can see */
  allowedRoles?: UserRole[];
}

export interface ThemeColors {
  active: string;
  hover: string;
  icon: string;
  groupTitle: string;
  border: string;
}

// MenuItem interface for the provided menu structure
export interface MenuItem {
  id?: number;
  label?: string;
  icon?: string;
  link?: string;
  subItems?: MenuItem[];
  isTitle?: boolean;
  parentId?: number;
  isLayout?: boolean;
  queryparams?: Record<string, unknown>;
  role?: "admin";
  permission?: string;
  cansee?: boolean;
  badge?: {
    text: string;
    variant: string;
  };
}

// Simplified, cleaner theme colors for better readability
export const COLOR_CLASSES: Record<ThemeKey, ThemeColors> = {
  primary: {
    // Clean active state with primary background
    active: "bg-primary text-primary-foreground",
    // Subtle hover with accent colors
    hover: "hover:bg-accent hover:text-accent-foreground cursor-pointer",
    // Icon inherits text color
    icon: "",
    // Clean group titles
    groupTitle:
      "text-xs font-semibold uppercase tracking-wide text-muted-foreground cursor-pointer",
    // Subtle borders
    border: "border-border",
  },
};

// Enhanced icon registry
export const ICON_REGISTRY: Record<string, LucideIcon> = {
  Home,
  Users,
  ShoppingCart,
  Plus,
  List,
  Clock,
  Eye,
};

// Sidebar configuration with role-based access
export const sidebarConfig: SidebarGroup[] = [
  {
    titleKey: "sidebar.main",
    expandable: true,
    // All roles can see the main section
    items: [
      {
        labelKey: "sidebar.home",
        href: "/home",
        icon: Home,
        theme: "primary",
        // All roles can access home
      },
    ],
  },
  {
    titleKey: "sidebar.orders",
    expandable: true,
    items: [
      {
        labelKey: "sidebar.createOrder",
        href: "/create-order",
        icon: Plus,
        theme: "primary",
        // Only Admin, SubAdmin, Engineering, and Site can create orders
        allowedRoles: [UserRole.Admin, UserRole.SubAdmin, UserRole.Engineering, UserRole.Site],
      },
      {
        labelKey: "sidebar.allOrders",
        href: "/orders/all",
        icon: List,
        theme: "primary",
        // Only Admin and SubAdmin can see all orders
        allowedRoles: [UserRole.Admin, UserRole.SubAdmin],
      },
      {
        labelKey: "sidebar.currentOrders",
        href: "/orders/current",
        icon: Clock,
        theme: "primary",
        // All roles can see current orders (filtered by backend based on role)
      },
    ],
  },
  {
    titleKey: "sidebar.users",
    expandable: true,
    // Admin and SubAdmin can see the users section
    allowedRoles: [UserRole.Admin, UserRole.SubAdmin],
    items: [
      {
        labelKey: "sidebar.userslist",
        href: "/users",
        icon: Users,
        theme: "primary",
        allowedRoles: [UserRole.Admin, UserRole.SubAdmin],
      },
    ],
  },
];
