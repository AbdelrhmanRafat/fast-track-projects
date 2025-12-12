/**
 * Projects Services
 * API functions for Projects module
 * 
 * All mutations (POST/PUT/DELETE) go through API routes using networkClient
 * Server-side GET uses NetworkLayer directly
 */

import networkClient from '@/lib/networkClient';
import { NetworkLayer } from '@/network';
import type { ApiResponse } from '@/lib/types/response';
import type {
  Project,
  ProjectStep,
  ProjectStepWithProject,
  ProjectsListData,
  ProjectFilters,
  CreateProjectRequest,
  UpdateProjectRequest,
  FinalizeProjectRequest,
  ContinueProjectRequest,
  AddStepRequest,
  UpdateStepRequest,
  UpdateStepActionRequest,
  FinalizeStepResponseData,
  CheckOverdueResponseData,
  CheckPermissionResponseData,
  ProjectEngineer,
} from './types';

// ==========================================
// Projects CRUD
// ==========================================

/**
 * Get all projects with pagination and filters (Server-Side)
 * Use this in server components (page.tsx)
 */
export async function getProjects(
  filters: ProjectFilters = {}
): Promise<ApiResponse<ProjectsListData> | null> {
  try {
    const api = await NetworkLayer.createWithAutoConfig();
    
    // Build query string
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.project_type) params.append('project_type', filters.project_type);
    if (filters.status) params.append('status', filters.status);
    if (filters.company_name) params.append('company_name', filters.company_name);
    if (filters.project_opening_status) params.append('project_opening_status', filters.project_opening_status);
    
    const queryString = params.toString();
    const url = queryString ? `/projects?${queryString}` : '/projects';
    
    const res = await api.get<ApiResponse<ProjectsListData>>(url);
    return res.data;
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    return null;
  }
}

/**
 * Get all projects with pagination and filters (Client-Side)
 * Use this in client components
 */
export async function getProjectsClient(
  filters: ProjectFilters = {}
): Promise<ApiResponse<ProjectsListData> | null> {
  try {
    // Build query string
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.project_type) params.append('project_type', filters.project_type);
    if (filters.status) params.append('status', filters.status);
    if (filters.company_name) params.append('company_name', filters.company_name);
    
    const queryString = params.toString();
    const url = queryString ? `/api/projects?${queryString}` : '/api/projects';
    
    const response = await networkClient.get(url);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch projects');
    }
    
    return result as ApiResponse<ProjectsListData>;
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    return null;
  }
}

/**
 * Get a single project by ID (Server-Side)
 */
export async function getProject(
  projectId: string
): Promise<ApiResponse<Project> | null> {
  try {
    const api = await NetworkLayer.createWithAutoConfig();
    const res = await api.get<ApiResponse<Project>>(`/projects?id=${projectId}`);
    return res.data;
  } catch (error: any) {
    console.error(`Error fetching project ${projectId}:`, error);
    return null;
  }
}

/**
 * Get a single project by ID (Client-Side)
 */
export async function getProjectClient(
  projectId: string
): Promise<ApiResponse<Project> | null> {
  try {
    const response = await networkClient.get(`/api/projects/${projectId}`);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch project');
    }
    
    return result as ApiResponse<Project>;
  } catch (error: any) {
    console.error(`Error fetching project ${projectId}:`, error);
    return null;
  }
}

/**
 * Create a new project
 */
export async function createProject(
  data: CreateProjectRequest
): Promise<ApiResponse<Project> | null> {
  try {
    const response = await networkClient.post('/api/projects', data);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to create project');
    }
    
    return result as ApiResponse<Project>;
  } catch (error: any) {
    console.error('Error creating project:', error);
    return null;
  }
}

/**
 * Update an existing project
 */
export async function updateProject(
  projectId: string,
  data: UpdateProjectRequest
): Promise<ApiResponse<Project> | null> {
  try {
    const response = await networkClient.put(`/api/projects/${projectId}`, data);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to update project');
    }
    
    return result as ApiResponse<Project>;
  } catch (error: any) {
    console.error(`Error updating project ${projectId}:`, error);
    return null;
  }
}

/**
 * Delete a project
 */
export async function deleteProject(
  projectId: string
): Promise<ApiResponse<null> | null> {
  try {
    const response = await networkClient.delete(`/api/projects/${projectId}`);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete project');
    }
    
    return result as ApiResponse<null>;
  } catch (error: any) {
    console.error(`Error deleting project ${projectId}:`, error);
    return null;
  }
}

/**
 * Finalize a project (mark as completed)
 * PUT /projects?id={projectId}
 * Body: { mark_as_completed: true }
 */
export async function finalizeProject(
  projectId: string
): Promise<ApiResponse<Project> | null> {
  try {
    const data: FinalizeProjectRequest = { mark_as_completed: true };
    const response = await networkClient.put(`/api/projects/${projectId}`, data);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to finalize project');
    }
    
    return result as ApiResponse<Project>;
  } catch (error: any) {
    console.error(`Error finalizing project ${projectId}:`, error);
    return null;
  }
}

/**
 * Continue project to inProgress with new steps
 * PUT /projects?id={projectId}
 * Body: { project_opening_status: "inProgress", new_steps: [...] }
 */
export async function continueProject(
  projectId: string,
  newSteps: ContinueProjectRequest['new_steps']
): Promise<ApiResponse<Project> | null> {
  try {
    const data: ContinueProjectRequest = {
      project_opening_status: 'inProgress',
      new_steps: newSteps,
    };
    const response = await networkClient.put(`/api/projects/${projectId}`, data);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to continue project');
    }
    
    return result as ApiResponse<Project>;
  } catch (error: any) {
    console.error(`Error continuing project ${projectId}:`, error);
    return null;
  }
}

// ==========================================
// Project Steps CRUD
// ==========================================

/**
 * Get a single step by ID (Server-Side)
 */
export async function getStep(
  stepId: string
): Promise<ApiResponse<ProjectStepWithProject> | null> {
  try {
    const api = await NetworkLayer.createWithAutoConfig();
    const res = await api.get<ApiResponse<ProjectStepWithProject>>(`/project-steps?id=${stepId}`);
    return res.data;
  } catch (error: any) {
    console.error(`Error fetching step ${stepId}:`, error);
    return null;
  }
}

/**
 * Check if user has permission to edit project steps (Server-Side)
 */
export async function checkEditPermission(
  projectId: string
): Promise<ApiResponse<CheckPermissionResponseData> | null> {
  try {
    const api = await NetworkLayer.createWithAutoConfig();
    const res = await api.get<ApiResponse<CheckPermissionResponseData>>(
      `/project-steps?project_id=${projectId}&check_permission=true`
    );
    return res.data;
  } catch (error: any) {
    console.error(`Error checking edit permission for project ${projectId}:`, error);
    return null;
  }
}

/**
 * Check if user has permission to edit project steps (Client-Side)
 */
export async function checkEditPermissionClient(
  projectId: string
): Promise<ApiResponse<CheckPermissionResponseData> | null> {
  try {
    const response = await networkClient.get(
      `/api/project-steps?project_id=${projectId}&check_permission=true`
    );
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to check permission');
    }
    
    return result as ApiResponse<CheckPermissionResponseData>;
  } catch (error: any) {
    console.error(`Error checking edit permission for project ${projectId}:`, error);
    return null;
  }
}

/**
 * Get a single step by ID (Client-Side)
 */
export async function getStepClient(
  stepId: string
): Promise<ApiResponse<ProjectStepWithProject> | null> {
  try {
    const response = await networkClient.get(`/api/project-steps/${stepId}`);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch step');
    }
    
    return result as ApiResponse<ProjectStepWithProject>;
  } catch (error: any) {
    console.error(`Error fetching step ${stepId}:`, error);
    return null;
  }
}

/**
 * Add a new step to a project
 */
export async function addStep(
  projectId: string,
  data: AddStepRequest
): Promise<ApiResponse<ProjectStep> | null> {
  try {
    const response = await networkClient.post(`/api/project-steps?project_id=${projectId}`, data);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to add step');
    }
    
    return result as ApiResponse<ProjectStep>;
  } catch (error: any) {
    console.error(`Error adding step to project ${projectId}:`, error);
    return null;
  }
}

/**
 * Update an existing step - DEPRECATED
 * Steps can no longer be edited. Use updateStepAction instead.
 */
export async function updateStep(
  stepId: string,
  data: UpdateStepRequest
): Promise<ApiResponse<ProjectStep> | null> {
  try {
    const response = await networkClient.put(`/api/project-steps/${stepId}`, data);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to update step');
    }
    
    return result as ApiResponse<ProjectStep>;
  } catch (error: any) {
    console.error(`Error updating step ${stepId}:`, error);
    return null;
  }
}

/**
 * Update step action - Finalize and/or add notes to a step
 * PUT /project-steps
 * 
 * Options:
 * - Add note only: { id, finalized_notes: [{ note: "..." }] }
 * - Finalize only: { id, is_finalized: true }
 * - Both: { id, is_finalized: true, finalized_notes: [{ note: "..." }] }
 */
export async function updateStepAction(
  data: UpdateStepActionRequest
): Promise<ApiResponse<ProjectStep> | null> {
  try {
    const response = await networkClient.put('/api/project-steps', data);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to update step');
    }
    
    return result as ApiResponse<ProjectStep>;
  } catch (error: any) {
    console.error(`Error updating step ${data.id}:`, error);
    return null;
  }
}

/**
 * Finalize a step - DEPRECATED
 * Use updateStepAction instead
 */
export async function finalizeStep(
  stepId: string
): Promise<ApiResponse<FinalizeStepResponseData> | null> {
  try {
    const response = await networkClient.put(`/api/project-steps/${stepId}`, { finalize: true });
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to finalize step');
    }
    
    return result as ApiResponse<FinalizeStepResponseData>;
  } catch (error: any) {
    console.error(`Error finalizing step ${stepId}:`, error);
    return null;
  }
}

/**
 * Delete a step
 */
export async function deleteStep(
  stepId: string
): Promise<ApiResponse<null> | null> {
  try {
    const response = await networkClient.delete(`/api/project-steps/${stepId}`);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete step');
    }
    
    return result as ApiResponse<null>;
  } catch (error: any) {
    console.error(`Error deleting step ${stepId}:`, error);
    return null;
  }
}

// ==========================================
// Additional Endpoints
// ==========================================

/**
 * Get all project engineers (Server-Side)
 */
export async function getProjectEngineers(): Promise<ApiResponse<ProjectEngineer[]> | null> {
  try {
    const api = await NetworkLayer.createWithAutoConfig();
    const res = await api.get<ApiResponse<ProjectEngineer[]>>('/get-project-engineers');
    return res.data;
  } catch (error: any) {
    console.error('Error fetching project engineers:', error);
    return null;
  }
}

/**
 * Get all project engineers (Client-Side)
 */
export async function getProjectEngineersClient(): Promise<ApiResponse<ProjectEngineer[]> | null> {
  try {
    const response = await networkClient.get('/api/project-engineers');
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch project engineers');
    }
    
    return result as ApiResponse<ProjectEngineer[]>;
  } catch (error: any) {
    console.error('Error fetching project engineers:', error);
    return null;
  }
}

/**
 * Check and mark overdue projects (Admin only)
 */
export async function checkOverdueProjects(): Promise<ApiResponse<CheckOverdueResponseData> | null> {
  try {
    const response = await networkClient.post('/api/projects/check-overdue', {});
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to check overdue projects');
    }
    
    return result as ApiResponse<CheckOverdueResponseData>;
  } catch (error: any) {
    console.error('Error checking overdue projects:', error);
    return null;
  }
}
