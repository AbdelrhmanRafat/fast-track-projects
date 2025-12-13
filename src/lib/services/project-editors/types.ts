/**
 * Project Editors Module Types
 * 
 * Type definitions for project editors API responses and data structures.
 * Project Editors are users assigned by Admin/Sub-admin to edit specific projects.
 */

import { UserRole } from '@/lib/types/userRoles';

// ==========================================
// Editor User Types
// ==========================================

/**
 * Basic user info for editor assignment
 */
export interface EditorUser {
  id: string;
  name: string;
  role: UserRole | string;
}

/**
 * User who assigned the editor (Admin/Sub-admin)
 */
export interface EditorAssigner {
  id: string;
  name: string;
}

// ==========================================
// Project Editor Types
// ==========================================

/**
 * Project editor assignment record
 */
export interface ProjectEditor {
  id: string;
  project_id: string;
  user_id: string;
  created_at: string;
  user: EditorUser;
  assigner: EditorAssigner;
}

/**
 * Basic project info in editors response
 */
export interface ProjectEditorProject {
  id: string;
  project_name: string;
  created_by: string;
}

// ==========================================
// Response Types
// ==========================================

/**
 * Response data for GET /project-editors?project_id=...
 */
export interface ProjectEditorsData {
  project: ProjectEditorProject;
  editors: ProjectEditor[];
}

// ==========================================
// Request Types
// ==========================================

/**
 * Request body for assigning a project editor
 * POST /project-editors
 */
export interface AssignProjectEditorRequest {
  project_id: string;
  user_id: string;
}

/**
 * Request body for removing a project editor
 * DELETE /project-editors
 */
export interface RemoveProjectEditorRequest {
  project_id: string;
  user_id: string;
}
