/**
 * Project Editors Services
 * 
 * API functions for managing project editors.
 * Project Editors are users assigned by Admin/Sub-admin to edit specific projects.
 * 
 * Server-side GET uses NetworkLayer directly
 * Client-side mutations (POST/DELETE) use networkClient through API routes
 */

import networkClient from '@/lib/networkClient';
import { NetworkLayer } from '@/network';
import type { ApiResponse } from '@/lib/types/response';
import type {
  ProjectEditorsData,
  ProjectEditor,
  AssignProjectEditorRequest,
  RemoveProjectEditorRequest,
} from './types';

// ==========================================
// Server-Side Functions (for Server Components)
// ==========================================

/**
 * Get all editors assigned to a specific project (Server-Side)
 * Use this in server components (page.tsx)
 * 
 * @param projectId - The project UUID
 * @returns Promise<ApiResponse<ProjectEditorsData> | null>
 * 
 * @example
 * ```tsx
 * // In a server component
 * const editorsData = await getProjectEditors('project-uuid');
 * if (editorsData?.data) {
 *   console.log(editorsData.data.editors);
 * }
 * ```
 */
export async function getProjectEditors(
  projectId: string
): Promise<ApiResponse<ProjectEditorsData> | null> {
  try {
    const api = await NetworkLayer.createWithAutoConfig();
    const res = await api.get<ApiResponse<ProjectEditorsData>>(
      `/project-editors?project_id=${projectId}`
    );
    return res.data;
  } catch (error: any) {
    console.error(`Error fetching project editors for project ${projectId}:`, error);
    return null;
  }
}

// ==========================================
// Client-Side Functions (for Client Components)
// ==========================================

/**
 * Get all editors assigned to a specific project (Client-Side)
 * Use this in client components
 * 
 * @param projectId - The project UUID
 * @returns Promise<ApiResponse<ProjectEditorsData> | null>
 */
export async function getProjectEditorsClient(
  projectId: string
): Promise<ApiResponse<ProjectEditorsData> | null> {
  try {
    const response = await networkClient.get(
      `/api/project-editors?project_id=${projectId}`
    );
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch project editors');
    }
    
    return result as ApiResponse<ProjectEditorsData>;
  } catch (error: any) {
    console.error(`Error fetching project editors for project ${projectId}:`, error);
    return null;
  }
}

/**
 * Assign a user as an editor for a specific project
 * Only Admin and Sub-admin can assign editors
 * 
 * @param data - The assignment request containing project_id and user_id
 * @returns Promise<ApiResponse<ProjectEditor> | null>
 * 
 * @example
 * ```tsx
 * const result = await assignProjectEditor({
 *   project_id: 'project-uuid',
 *   user_id: 'user-uuid'
 * });
 * if (result) {
 *   toast.success('Editor assigned successfully');
 * }
 * ```
 */
export async function assignProjectEditor(
  data: AssignProjectEditorRequest
): Promise<ApiResponse<ProjectEditor> | null> {
  try {
    const response = await networkClient.post('/api/project-editors', data);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to assign project editor');
    }
    
    return result as ApiResponse<ProjectEditor>;
  } catch (error: any) {
    console.error('Error assigning project editor:', error);
    return null;
  }
}

/**
 * Remove a user from the project editors list
 * Only Admin and Sub-admin can remove editors
 * 
 * @param data - The removal request containing project_id and user_id
 * @returns Promise<ApiResponse<null> | null>
 * 
 * @example
 * ```tsx
 * const result = await removeProjectEditor({
 *   project_id: 'project-uuid',
 *   user_id: 'user-uuid'
 * });
 * if (result) {
 *   toast.success('Editor removed successfully');
 * }
 * ```
 */
export async function removeProjectEditor(
  data: RemoveProjectEditorRequest
): Promise<ApiResponse<null> | null> {
  try {
    const response = await networkClient.delete('/api/project-editors', {
      body: JSON.stringify(data),
    });
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to remove project editor');
    }
    
    return result as ApiResponse<null>;
  } catch (error: any) {
    console.error('Error removing project editor:', error);
    return null;
  }
}
