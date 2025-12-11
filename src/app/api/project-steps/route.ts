import { NextRequest, NextResponse } from 'next/server';
import { NetworkLayer } from '@/network';
import type { ApiResponse } from '@/lib/types/response';
import type { ProjectStep, AddStepRequest } from '@/lib/services/projects/types';

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
 * POST /api/project-steps?project_id={projectId}
 * Add a new step to a project
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ProjectStep> | ApiResponse<null>>> {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    
    if (!projectId) {
      return NextResponse.json(
        {
          code: 400,
          status: 400,
          message: 'معرف المشروع مطلوب',
          errors: 'معرف المشروع مطلوب',
          data: null,
        },
        { status: 400 }
      );
    }
    
    const body: AddStepRequest = await request.json();
    
    const networkLayer = await NetworkLayer.createWithAutoConfig();
    const response = await networkLayer.post<ApiResponse<ProjectStep>>(
      `/project-steps?project_id=${projectId}`,
      body
    );
    
    return NextResponse.json(response.data, { status: 201 });
  } catch (error: any) {
    console.error('Error adding step:', error);
    const backendMessage = extractBackendMessage(error, 'فشل في إضافة الخطوة');
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
