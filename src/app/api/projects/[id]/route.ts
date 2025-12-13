import { NextRequest, NextResponse } from 'next/server';
import { NetworkLayer } from '@/network';
import type { ApiResponse } from '@/lib/types/response';
import type { Project, UpdateProjectRequest } from '@/lib/services/projects/types';

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
 * GET /api/projects/[id]
 * Get a single project by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Project> | ApiResponse<null>>> {
  try {
    const { id } = await params;
    
    const networkLayer = await NetworkLayer.createWithAutoConfig();
    const response = await networkLayer.get<ApiResponse<Project>>(`/projects?id=${id}`);
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    const { id } = await params;
    console.error(`Error fetching project ${id}:`, error);
    const backendMessage = extractBackendMessage(error, 'فشل في جلب المشروع');
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
 * PUT /api/projects/[id]
 * Update a project
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Project> | ApiResponse<null>>> {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const networkLayer = await NetworkLayer.createWithAutoConfig();
    const response = await networkLayer.put<ApiResponse<Project>>(`/projects?id=${id}`, body);
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    const { id } = await params;
    console.error(`Error updating project ${id}:`, error);
    const backendMessage = extractBackendMessage(error, 'فشل في تحديث المشروع');
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
 * DELETE /api/projects/[id]
 * Delete a project
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { id } = await params;
    
    const networkLayer = await NetworkLayer.createWithAutoConfig();
    const response = await networkLayer.delete<ApiResponse<null>>(`/projects?id=${id}`);
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    const { id } = await params;
    console.error(`Error deleting project ${id}:`, error);
    const backendMessage = extractBackendMessage(error, 'فشل في حذف المشروع');
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
