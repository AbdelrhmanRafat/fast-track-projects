import { NextRequest, NextResponse } from 'next/server';
import { NetworkLayer } from '@/network';
import type { ApiResponse } from '@/lib/types/response';
import type { CheckOverdueResponseData } from '@/lib/services/projects/types';

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
 * POST /api/projects/check-overdue
 * Check and mark overdue projects (Admin only)
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<CheckOverdueResponseData> | ApiResponse<null>>> {
  try {
    const networkLayer = await NetworkLayer.createWithAutoConfig();
    const response = await networkLayer.post<ApiResponse<CheckOverdueResponseData>>(
      '/check-overdue-projects',
      {}
    );
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error checking overdue projects:', error);
    const backendMessage = extractBackendMessage(error, 'فشل في فحص المشاريع المتأخرة');
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
