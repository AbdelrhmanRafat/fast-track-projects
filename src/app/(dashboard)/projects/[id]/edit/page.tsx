import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import EditProjectClient from './pageClient';
import EditProjectLoading from './loading';
import { getProject, checkEditPermission } from '@/lib/services/projects';

interface EditProjectPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Edit Project Page - Server Component
 * Fetches project data and checks edit permission
 * Redirects to unauthorized if user cannot edit
 */
export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { id } = await params;

  // Fetch project data and check permission in parallel
  const [projectResponse, permissionResponse] = await Promise.all([
    getProject(id),
    checkEditPermission(id),
  ]);

  // Handle not found
  if (!projectResponse || !projectResponse.data) {
    notFound();
  }

  // Extract can_edit flag, default to false if permission check fails
  const canEdit = permissionResponse?.data?.can_edit ?? false;

  // Redirect to unauthorized if user cannot edit
  if (!canEdit) {
    redirect(`/projects/${id}?error=unauthorized`);
  }

  return (
    <Suspense fallback={<EditProjectLoading />}>
      <EditProjectClient project={projectResponse.data} canEdit={canEdit} />
    </Suspense>
  );
}
