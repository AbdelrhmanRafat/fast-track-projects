import { NextRequest, NextResponse } from 'next/server';
import { NetworkLayer } from '@/network';
import type { ApiResponse } from '@/lib/types/response';
import type { Project, ProjectsListData, CreateProjectRequest } from '@/lib/services/projects/types';

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
 * GET /api/projects
 * Get all projects with pagination and filters
 * 
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 10)
 * - search: string (search in project_name, project_description, company_name)
 * - project_type: 'siteProject' | 'designProject'
 * - status: 'active' | 'completed' | 'overdue'
 * - company_name: string (partial match)
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ProjectsListData> | ApiResponse<null>>> {
  try {
    const { searchParams } = new URL(request.url);
    
    // Build query string for backend
    const params = new URLSearchParams();
    
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    const search = searchParams.get('search');
    const project_type = searchParams.get('project_type');
    const status = searchParams.get('status');
    const company_name = searchParams.get('company_name');
    
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (search) params.append('search', search);
    if (project_type) params.append('project_type', project_type);
    if (status) params.append('status', status);
    if (company_name) params.append('company_name', company_name);
    
    const queryString = params.toString();
    const url = queryString ? `/projects?${queryString}` : '/projects';
    
    const networkLayer = await NetworkLayer.createWithAutoConfig();
    const response = await networkLayer.get<ApiResponse<ProjectsListData>>(url);
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    const backendMessage = extractBackendMessage(error, 'فشل في جلب المشاريع');
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
 * POST /api/projects
 * Create a new project with steps
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Project> | ApiResponse<null>>> {
  try {
    const body: CreateProjectRequest = await request.json();
    
    const networkLayer = await NetworkLayer.createWithAutoConfig();
    const response = await networkLayer.post<ApiResponse<Project>>('/projects', body);
    
    return NextResponse.json(response.data, { status: 201 });
  } catch (error: any) {
    console.error('Error creating project:', error);
    const backendMessage = extractBackendMessage(error, 'فشل في إنشاء المشروع');
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
