import { NextRequest, NextResponse } from 'next/server';
import { NetworkLayer } from '@/network';
import type { ApiResponse } from '@/lib/types/response';

/**
 * PUT /api/users/toggle-activation?id=USER_UUID_HERE - Toggle user activation status
 */
export async function PUT(
  request: NextRequest
): Promise<NextResponse<ApiResponse<any> | ApiResponse<null>>> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          code: 400,
          status: 400,
          errors: 'User ID is required',
          message: 'User ID is required',
          data: null
        } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // Create NetworkLayer instance
    const networkLayer = await NetworkLayer.createWithAutoConfig();

    // Make request to external API
    const response = await networkLayer.put<ApiResponse<any>>(
      `/toggle-user-activation?id=${id}`,
      {}
    );

    // Return backend ApiResponse directly
    return NextResponse.json(response.data);
  } catch (error: any) {
    // Handle network/axios errors
    if (error.response?.data) {
      return NextResponse.json(error.response.data, {
        status: error.response.status || 500
      });
    }

    return NextResponse.json(
      {
        code: 500,
        status: 500,
        errors: error.message || 'Internal server error',
        message: error.message || 'Internal server error',
        data: null
      } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
