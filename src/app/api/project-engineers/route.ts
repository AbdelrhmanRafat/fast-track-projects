import { NextRequest, NextResponse } from 'next/server';
import { NetworkLayer } from '@/network';
import type { ApiResponse } from '@/lib/types/response';
import type { ProjectEngineer } from '@/lib/services/projects/types';

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
 * GET /api/project-engineers
 * Get all project engineers
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ProjectEngineer[]> | ApiResponse<null>>> {
  try {
    const networkLayer = await NetworkLayer.createWithAutoConfig();
    const response = await networkLayer.get<ApiResponse<ProjectEngineer[]>>('/get-project-engineers');
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching project engineers:', error);
    const backendMessage = extractBackendMessage(error, 'فشل في جلب مهندسي المشاريع');
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
