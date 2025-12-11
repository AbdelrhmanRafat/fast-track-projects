import { NextRequest, NextResponse } from 'next/server';
import { NetworkLayer } from '@/network';
import type { ApiResponse } from '@/lib/types/response';
import type { 
  ProjectStep, 
  ProjectStepWithProject, 
  UpdateStepRequest, 
  FinalizeStepResponseData 
} from '@/lib/services/projects/types';

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
 * GET /api/project-steps/[id]
 * Get a single step by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<ProjectStepWithProject> | ApiResponse<null>>> {
  try {
    const { id } = await params;
    
    const networkLayer = await NetworkLayer.createWithAutoConfig();
    const response = await networkLayer.get<ApiResponse<ProjectStepWithProject>>(
      `/project-steps?id=${id}`
    );
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    const { id } = await params;
    console.error(`Error fetching step ${id}:`, error);
    const backendMessage = extractBackendMessage(error, 'فشل في جلب الخطوة');
    const statusCode = error.status || 500;
    
    return NextResponse.json(
      {
        code: statusCode,
        status: statusCode,
        message: backendMessage,
        errors: backendMessage,
        data: null,
      },
      { status: statusCode }
    );
  }
}

/**
 * PUT /api/project-steps/[id]
 * Update a step or finalize it
 * 
 * If body contains { finalize: true }, the step will be finalized
 * Otherwise, the step will be updated with the provided data
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<ProjectStep | FinalizeStepResponseData> | ApiResponse<null>>> {
  try {
    const { id } = await params;
    const body: UpdateStepRequest | { finalize: true } = await request.json();
    
    const networkLayer = await NetworkLayer.createWithAutoConfig();
    const response = await networkLayer.put<ApiResponse<ProjectStep | FinalizeStepResponseData>>(
      `/project-steps?id=${id}`,
      body
    );
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    const { id } = await params;
    console.error(`Error updating step ${id}:`, error);
    const backendMessage = extractBackendMessage(error, 'فشل في تحديث الخطوة');
    const statusCode = error.status || 500;
    
    return NextResponse.json(
      {
        code: statusCode,
        status: statusCode,
        message: backendMessage,
        errors: backendMessage,
        data: null,
      },
      { status: statusCode }
    );
  }
}

/**
 * DELETE /api/project-steps/[id]
 * Delete a step
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { id } = await params;
    
    const networkLayer = await NetworkLayer.createWithAutoConfig();
    const response = await networkLayer.delete<ApiResponse<null>>(`/project-steps?id=${id}`);
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    const { id } = await params;
    console.error(`Error deleting step ${id}:`, error);
    const backendMessage = extractBackendMessage(error, 'فشل في حذف الخطوة');
    const statusCode = error.status || 500;
    
    return NextResponse.json(
      {
        code: statusCode,
        status: statusCode,
        message: backendMessage,
        errors: backendMessage,
        data: null,
      },
      { status: statusCode }
    );
  }
}
