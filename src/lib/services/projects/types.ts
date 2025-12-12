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

/**
 * Project opening status enum (tinder/inProgress)
 */
export enum ProjectOpeningStatus {
  Tinder = 'tinder',
  InProgress = 'inProgress',
}

/**
 * Step phase enum (tinder/inProgress)
 */
export enum StepPhase {
  Tinder = 'tinder',
  InProgress = 'inProgress',
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
  step_phase: StepPhase;
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
  project_opening_status: ProjectOpeningStatus;
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
 * Finalize project request body
 * Marks the project as completed
 */
export interface FinalizeProjectRequest {
  mark_as_completed: true;
}

/**
 * New step for continuing project to inProgress
 */
export interface NewStepRequest {
  step_name: string;
  step_description?: string;
  duration_from?: string;
  duration_to?: string;
}

/**
 * Continue project to inProgress request body
 * Changes project_opening_status to inProgress and adds new steps
 */
export interface ContinueProjectRequest {
  project_opening_status: 'inProgress';
  new_steps: NewStepRequest[];
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
  project_opening_status?: ProjectOpeningStatus;
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
 * Project status badge classes (following brand design system)
 * Format: bg-[color]-100 text-[color]-700 dark:bg-[color]-900/50 dark:text-[color]-300 border-[color]-200 dark:border-[color]-800
 */
export const PROJECT_STATUS_BADGE_CLASSES: Record<ProjectStatus, string> = {
  [ProjectStatus.Active]: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  [ProjectStatus.Completed]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  [ProjectStatus.Overdue]: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-800',
};

/**
 * Project type colors for UI (light mode)
 */
export const PROJECT_TYPE_COLORS: Record<ProjectType, string> = {
  [ProjectType.SiteProject]: 'bg-purple-100 text-purple-700',
  [ProjectType.DesignProject]: 'bg-cyan-100 text-cyan-700',
};

/**
 * Project type colors for UI (dark mode)
 */
export const PROJECT_TYPE_COLORS_DARK: Record<ProjectType, string> = {
  [ProjectType.SiteProject]: 'dark:bg-purple-900/50 dark:text-purple-300',
  [ProjectType.DesignProject]: 'dark:bg-cyan-900/50 dark:text-cyan-300',
};

/**
 * Project type badge classes (following brand design system)
 * Format: bg-[color]-100 text-[color]-700 dark:bg-[color]-900/50 dark:text-[color]-300 border-[color]-200 dark:border-[color]-800
 */
export const PROJECT_TYPE_BADGE_CLASSES: Record<ProjectType, string> = {
  [ProjectType.SiteProject]: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  [ProjectType.DesignProject]: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
};

/**
 * Step finalization status badge classes (following brand design system)
 */
export const STEP_STATUS_BADGE_CLASSES = {
  finalized: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  notStarted: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
} as const;

/**
 * Project opening status badge classes (following brand design system)
 * tinder = Tendering phase (orange/amber)
 * inProgress = In Progress phase (blue)
 */
export const PROJECT_OPENING_STATUS_BADGE_CLASSES: Record<ProjectOpeningStatus, string> = {
  [ProjectOpeningStatus.Tinder]: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  [ProjectOpeningStatus.InProgress]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
};

/**
 * Step phase badge classes (following brand design system)
 * tinder = Tendering phase (orange/amber)
 * inProgress = In Progress phase (blue)
 */
export const STEP_PHASE_BADGE_CLASSES: Record<StepPhase, string> = {
  [StepPhase.Tinder]: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  [StepPhase.InProgress]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
};
