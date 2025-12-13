import { NextRequest, NextResponse } from 'next/server';
import { NetworkLayer } from '@/network';
import type { ApiResponse } from '@/lib/types/response';
import type {
  ProjectEditorsData,
  ProjectEditor,
  AssignProjectEditorRequest,
  RemoveProjectEditorRequest,
} from '@/lib/services/project-editors/types';

/**
 * Helper function to extract backend error message
 */
function extractBackendMessage(error: any, fallback: string): string {
  const d = error?.details;
  if (!d) return error.message || fallback;
  if (typeof d === 'string') return d;
  if (d.message) return d.message;
  if (d.error) {
    if (typeof d.error === 'string') return d.error;
    if (d.error.message) return d.error.message;
  }
  if (d.errors) {
    if (typeof d.errors === 'string') return d.errors;
    if (typeof d.errors === 'object') {
      const first = Object.values(d.errors)[0];
      if (Array.isArray(first) && first.length > 0) {
        return String(first[0]);
      }
    }
  }
  if (d.msg) return d.msg;
  return error.message || fallback;
}

/**
 * GET /api/project-editors
 * Get all editors assigned to a project
 * 
 * Query params:
 * - project_id: string (required)
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ProjectEditorsData> | ApiResponse<null>>> {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!projectId) {
      return NextResponse.json(
        {
          code: 400,
          status: 400,
          errors: 'project_id is required',
          message: 'project_id is required',
          data: null,
        },
        { status: 400 }
      );
    }

    const networkLayer = await NetworkLayer.createWithAutoConfig();
    const response = await networkLayer.get<ApiResponse<ProjectEditorsData>>(
      `/project-editors?project_id=${projectId}`
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching project editors:', error);
    const backendMessage = extractBackendMessage(error, 'Failed to fetch project editors');
    const statusCode = error.status || 500;

    return NextResponse.json(
      {
        code: statusCode,
        status: statusCode,
        errors: backendMessage,
        message: backendMessage,
        data: null,
      },
      { status: statusCode }
    );
  }
}

/**
 * POST /api/project-editors
 * Assign a user as an editor for a project
 * 
 * Body:
 * - project_id: string (required)
 * - user_id: string (required)
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ProjectEditor> | ApiResponse<null>>> {
  try {
    const body: AssignProjectEditorRequest = await request.json();

    if (!body.project_id || !body.user_id) {
      return NextResponse.json(
        {
          code: 400,
          status: 400,
          errors: 'project_id and user_id are required',
          message: 'project_id and user_id are required',
          data: null,
        },
        { status: 400 }
      );
    }

    const networkLayer = await NetworkLayer.createWithAutoConfig();
    const response = await networkLayer.post<ApiResponse<ProjectEditor>>(
      '/project-editors',
      body
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error assigning project editor:', error);
    const backendMessage = extractBackendMessage(error, 'Failed to assign project editor');
    const statusCode = error.status || 500;

    return NextResponse.json(
      {
        code: statusCode,
        status: statusCode,
        errors: backendMessage,
        message: backendMessage,
        data: null,
      },
      { status: statusCode }
    );
  }
}

/**
 * DELETE /api/project-editors
 * Remove a user from project editors
 * 
 * Body:
 * - project_id: string (required)
 * - user_id: string (required)
 */
export async function DELETE(
  request: NextRequest
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const body: RemoveProjectEditorRequest = await request.json();

    if (!body.project_id || !body.user_id) {
      return NextResponse.json(
        {
          code: 400,
          status: 400,
          errors: 'project_id and user_id are required',
          message: 'project_id and user_id are required',
          data: null,
        },
        { status: 400 }
      );
    }

    const networkLayer = await NetworkLayer.createWithAutoConfig();
    const response = await networkLayer.delete<ApiResponse<null>>(
      `/project-editors?project_id=${body.project_id}&user_id=${body.user_id}`
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error removing project editor:', error);
    const backendMessage = extractBackendMessage(error, 'Failed to remove project editor');
    const statusCode = error.status || 500;

    return NextResponse.json(
      {
        code: statusCode,
        status: statusCode,
        errors: backendMessage,
        message: backendMessage,
        data: null,
      },
      { status: statusCode }
    );
  }
}
