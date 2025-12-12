/**
 * Projects Module Types
 * Type definitions for projects API responses and data structures.
 * Based on PROJECTS_FRONTEND_DOCUMENTATION.md
 */

// Import ProjectNotificationType from notifications module
import { ProjectNotificationType } from '../notifications/types';

// Re-export for convenience
export { ProjectNotificationType };

// ==========================================
// Enums
// ==========================================

/**
 * Project types enum
 */
export enum ProjectType {
  SiteProject = 'siteProject',
  DesignProject = 'designProject',
}

/**
 * Project status enum
 */
export enum ProjectStatus {
  Active = 'active',
  Completed = 'completed',
  Overdue = 'overdue',
}

// ==========================================
// Project Step Types
// ==========================================

/**
 * Finalized note entry in project step
 */
export interface FinalizedNote {
  note: string;
  timestamp: string;
  created_by: string;
}

/**
 * Project step stored in database
 */
export interface ProjectStep {
  id: string;
  project_id: string;
  step_name: string;
  step_description: string | null;
  duration_from: string | null;
  duration_to: string | null;
  is_finalized: boolean;
  finalized_at: string | null;
  finalized_notes: FinalizedNote[];
  step_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Step with associated project info (for step details)
 */
export interface ProjectStepWithProject extends ProjectStep {
  project: {
    id: string;
    project_name: string;
    created_by: string;
  };
}

// ==========================================
// Project Types
// ==========================================

/**
 * Project creator information
 */
export interface ProjectCreator {
  id: string;
  name: string;
}

/**
 * Project progress information
 */
export interface ProjectProgress {
  total: number;
  finalized: number;
  percentage: number;
}

/**
 * Project stored in database
 */
export interface Project {
  id: string;
  project_name: string;
  project_type: ProjectType;
  project_description: string | null;
  company_name: string | null;
  duration_from: string;
  duration_to: string | null;
  status: ProjectStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: ProjectCreator;
  project_steps?: ProjectStep[];
  progress?: ProjectProgress;
}

// ==========================================
// Request Types
// ==========================================

/**
 * Create step request (used when creating project)
 */
export interface CreateStepRequest {
  step_name: string;
  step_description?: string;
  duration_from?: string;
  duration_to?: string;
  step_order?: number;
}

/**
 * Create project request body
 */
export interface CreateProjectRequest {
  project_name: string;
  project_type: ProjectType;
  project_description?: string;
  company_name?: string;
  duration_from: string;
  duration_to?: string;
  steps: CreateStepRequest[];
}

/**
 * Update project request body
 */
export interface UpdateProjectRequest {
  project_name?: string;
  project_type?: ProjectType;
  project_description?: string;
  company_name?: string;
  duration_from?: string;
  duration_to?: string;
}

/**
 * Update step request body - DEPRECATED
 * Steps can no longer be edited (title, description, duration)
 * Only finalization and notes are allowed via UpdateStepActionRequest
 */
export interface UpdateStepRequest {
  step_name?: string;
  step_description?: string;
  duration_from?: string;
  duration_to?: string;
  step_order?: number;
}

/**
 * Step action request body for finalization and adding notes
 * Used for PUT /project-steps
 */
export interface UpdateStepActionRequest {
  id: string;
  is_finalized?: true;
  finalized_notes?: Array<{ note: string }>;
}

/**
 * Finalize step request body - DEPRECATED
 * Use UpdateStepActionRequest instead
 */
export interface FinalizeStepRequest {
  finalize: true;
}

/**
 * Add step to project request body
 */
export interface AddStepRequest {
  step_name: string;
  step_description?: string;
  duration_from?: string;
  duration_to?: string;
  step_order?: number;
}

// ==========================================
// Query/Filter Types
// ==========================================

/**
 * Project filters for list endpoint
 */
export interface ProjectFilters {
  page?: number;
  limit?: number;
  search?: string;
  project_type?: ProjectType;
  status?: ProjectStatus;
  company_name?: string;
}

// ==========================================
// Response Types
// ==========================================

/**
 * Pagination info in response
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Paginated projects list response data
 */
export interface ProjectsListData {
  data: Project[];
  pagination: PaginationInfo;
}

/**
 * Step finalization response data
 */
export interface FinalizeStepResponseData {
  step_finalized: boolean;
  project_completed: boolean;
}

/**
 * Check overdue projects response data
 */
export interface CheckOverdueResponseData {
  overdue_count: number;
  projects: Array<{
    id: string;
    project_name: string;
    duration_to: string;
    engineer: string;
  }>;
}

/**
 * Check permission response data
 */
export interface CheckPermissionResponseData {
  can_edit: boolean;
  project_id: string;
  reason: string;
}

/**
 * Project engineer user
 */
export interface ProjectEngineer {
  id: string;
  account_name: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==========================================
// Notification Types for Projects
// ==========================================

/**
 * Project notification data
 */
export interface ProjectNotificationData {
  type: ProjectNotificationType;
  projectId: string;
  projectName: string;
  projectType?: ProjectType;
  created_by?: string;
}

// ==========================================
// Form Types (for frontend forms)
// ==========================================

/**
 * Step form data (for create/edit forms)
 */
export interface StepFormData {
  id?: string; // For tracking in UI
  step_name: string;
  step_description: string;
  duration_from: string;
  duration_to: string;
  step_order: number;
}

/**
 * Create project form data
 */
export interface CreateProjectFormData {
  project_name: string;
  project_type: ProjectType;
  project_description: string;
  company_name: string;
  duration_from: string;
  duration_to: string;
  steps: StepFormData[];
}

/**
 * Update project form data
 */
export interface UpdateProjectFormData {
  project_name: string;
  project_type: ProjectType;
  project_description: string;
  company_name: string;
  duration_from: string;
  duration_to: string;
}

// ==========================================
// Constants
// ==========================================

/**
 * Project type options for forms/filters
 * Use with translation keys: projects.types.all, projects.types.siteProject, projects.types.designProject
 */
export const PROJECT_TYPE_OPTIONS = [
  { value: '', labelKey: 'projects.types.all' },
  { value: ProjectType.SiteProject, labelKey: 'projects.types.siteProject' },
  { value: ProjectType.DesignProject, labelKey: 'projects.types.designProject' },
] as const;

/**
 * Project status options for forms/filters
 * Use with translation keys: projects.status.all, projects.status.active, etc.
 */
export const PROJECT_STATUS_OPTIONS = [
  { value: '', labelKey: 'projects.status.all' },
  { value: ProjectStatus.Active, labelKey: 'projects.status.active' },
  { value: ProjectStatus.Completed, labelKey: 'projects.status.completed' },
  { value: ProjectStatus.Overdue, labelKey: 'projects.status.overdue' },
] as const;

/**
 * Project type translation keys mapping
 */
export const PROJECT_TYPE_TRANSLATION_KEYS: Record<ProjectType, string> = {
  [ProjectType.SiteProject]: 'projects.types.siteProject',
  [ProjectType.DesignProject]: 'projects.types.designProject',
};

/**
 * Project status translation keys mapping
 */
export const PROJECT_STATUS_TRANSLATION_KEYS: Record<ProjectStatus, string> = {
  [ProjectStatus.Active]: 'projects.status.active',
  [ProjectStatus.Completed]: 'projects.status.completed',
  [ProjectStatus.Overdue]: 'projects.status.overdue',
};

/**
 * Project status colors for UI (light mode)
 */
export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  [ProjectStatus.Active]: 'bg-green-100 text-green-800',
  [ProjectStatus.Completed]: 'bg-blue-100 text-blue-800',
  [ProjectStatus.Overdue]: 'bg-red-100 text-red-800',
};

/**
 * Project status colors for UI (dark mode)
 */
export const PROJECT_STATUS_COLORS_DARK: Record<ProjectStatus, string> = {
  [ProjectStatus.Active]: 'dark:bg-green-900/30 dark:text-green-400',
  [ProjectStatus.Completed]: 'dark:bg-blue-900/30 dark:text-blue-400',
  [ProjectStatus.Overdue]: 'dark:bg-red-900/30 dark:text-red-400',
};

/**
 * Project status badge classes (combined light + dark mode)
 */
export const PROJECT_STATUS_BADGE_CLASSES: Record<ProjectStatus, string> = {
  [ProjectStatus.Active]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  [ProjectStatus.Completed]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  [ProjectStatus.Overdue]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

/**
 * Project type colors for UI (light mode)
 */
export const PROJECT_TYPE_COLORS: Record<ProjectType, string> = {
  [ProjectType.SiteProject]: 'bg-purple-100 text-purple-800',
  [ProjectType.DesignProject]: 'bg-indigo-100 text-indigo-800',
};

/**
 * Project type colors for UI (dark mode)
 */
export const PROJECT_TYPE_COLORS_DARK: Record<ProjectType, string> = {
  [ProjectType.SiteProject]: 'dark:bg-purple-900/30 dark:text-purple-400',
  [ProjectType.DesignProject]: 'dark:bg-indigo-900/30 dark:text-indigo-400',
};

/**
 * Project type badge classes (combined light + dark mode)
 */
export const PROJECT_TYPE_BADGE_CLASSES: Record<ProjectType, string> = {
  [ProjectType.SiteProject]: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  [ProjectType.DesignProject]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
};

/**
 * Step finalization status badge classes
 */
export const STEP_STATUS_BADGE_CLASSES = {
  finalized: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  notStarted: 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400',
} as const;
