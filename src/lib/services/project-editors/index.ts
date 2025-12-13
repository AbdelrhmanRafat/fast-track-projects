/**
 * Project Editors Module
 * 
 * Manages project editor assignments.
 * Project Editors are users assigned by Admin/Sub-admin to edit specific projects.
 * 
 * @module project-editors
 */

// Export types
export type {
  EditorUser,
  EditorAssigner,
  ProjectEditor,
  ProjectEditorProject,
  ProjectEditorsData,
  AssignProjectEditorRequest,
  RemoveProjectEditorRequest,
} from './types';

// Export services
export {
  // Server-side
  getProjectEditors,
  // Client-side
  getProjectEditorsClient,
  assignProjectEditor,
  removeProjectEditor,
} from './services';
