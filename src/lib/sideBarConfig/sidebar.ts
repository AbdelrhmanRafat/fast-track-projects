import {
  Users,
  LucideIcon,
  Plus,
  List,
  Clock,
  Briefcase,
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
  Users,
  Plus,
  List,
  Clock,
  Briefcase,
};

// Sidebar configuration with role-based access
export const sidebarConfig: SidebarGroup[] = [
  {
    titleKey: "sidebar.projects",
    expandable: true,
    items: [
      {
        labelKey: "sidebar.allProjects",
        href: "/projects/all",
        icon: List,
        theme: "primary",
      },
      {
        labelKey: "sidebar.currentProjects",
        href: "/projects/current",
        icon: Clock,
        theme: "primary",
      },
      {
        labelKey: "sidebar.createProject",
        href: "/projects/create",
        icon: Plus,
        theme: "primary",
        allowedRoles: [UserRole.Admin, UserRole.SubAdmin, UserRole.ProjectEngineers],
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
