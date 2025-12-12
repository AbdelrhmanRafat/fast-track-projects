export enum UserRole {
  Admin = "admin",
  SubAdmin = "sub-admin",
  ProjectEngineers = "project-engineers",
}

/**
 * Roles available for user creation (excludes Admin)
 */
export const CREATABLE_USER_ROLES: UserRole[] = [
  UserRole.SubAdmin,
  UserRole.ProjectEngineers,
];

/**
 * Roles that can access the Projects module
 */
export const PROJECT_MODULE_ROLES: UserRole[] = [
  UserRole.Admin,
  UserRole.SubAdmin,
  UserRole.ProjectEngineers,
];

/**
 * Roles that can view all projects (not just their own)
 */
export const PROJECT_VIEW_ALL_ROLES: UserRole[] = [
  UserRole.Admin,
  UserRole.SubAdmin,
];

/**
 * Roles that receive project notifications
 */
export const PROJECT_NOTIFICATION_ROLES: UserRole[] = [
  UserRole.Admin,
  UserRole.SubAdmin,
];

/**
 * Roles that can access Users management page
 */
export const USERS_MANAGEMENT_ROLES: UserRole[] = [
  UserRole.Admin,
  UserRole.SubAdmin,
];

/**
 * Role translation keys mapping
 */
export const USER_ROLE_TRANSLATION_KEYS: Record<UserRole, string> = {
  [UserRole.Admin]: 'users.roles.admin',
  [UserRole.SubAdmin]: 'users.roles.sub-admin',
  [UserRole.ProjectEngineers]: 'users.roles.project-engineers',
};

/**
 * Role badge classes (light + dark mode)
 */
export const USER_ROLE_BADGE_CLASSES: Record<UserRole, string> = {
  [UserRole.Admin]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  [UserRole.SubAdmin]: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  [UserRole.ProjectEngineers]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

/**
 * Check if a role can access the Projects module
 */
export function canAccessProjectsModule(role: UserRole): boolean {
  return PROJECT_MODULE_ROLES.includes(role);
}

/**
 * Check if a role can view all projects
 */
export function canViewAllProjects(role: UserRole): boolean {
  return PROJECT_VIEW_ALL_ROLES.includes(role);
}

/**
 * Check if a role receives project notifications
 */
export function receivesProjectNotifications(role: UserRole): boolean {
  return PROJECT_NOTIFICATION_ROLES.includes(role);
}

/**
 * Check if a role can access Users management
 */
export function canAccessUsersManagement(role: UserRole): boolean {
  return USERS_MANAGEMENT_ROLES.includes(role);
}
