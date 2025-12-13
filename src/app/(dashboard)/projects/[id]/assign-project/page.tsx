import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getProject } from '@/lib/services/projects';
import { getProjectEditors } from '@/lib/services/project-editors';
import { getUsers } from '@/lib/services/users';
import { canDeleteProject, UserRole } from '@/lib/types/userRoles';
import AssignProjectClient from './pageClient';
import Loading from './loading';

interface AssignProjectPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Assign Project Editors Page - Server Component
 * 
 * Fetches project info, current editors, and available users.
 * Only Admin and Sub-admin can access this page.
 */
export default async function AssignProjectPage({ params }: AssignProjectPageProps) {
  const { id } = await params;

  // Check user permissions from server-side cookies
  const cookieStore = await cookies();
  const userRole = cookieStore.get('UserRole')?.value as UserRole | undefined;
  
  if (!userRole || !canDeleteProject(userRole)) {
    redirect('/unauthorized');
  }

  // Fetch project data, current editors, and available users in parallel
  const [projectResponse, editorsResponse, usersResponse] = await Promise.all([
    getProject(id),
    getProjectEditors(id),
    getUsers(),
  ]);

  // Handle project not found
  if (!projectResponse || !projectResponse.data) {
    notFound();
  }

  const project = projectResponse.data;
  const currentEditors = editorsResponse?.data?.editors || [];
  const allUsers = usersResponse?.data?.data || [];

  // Filter out users who are already editors
  const editorUserIds = new Set(currentEditors.map(e => e.user_id));
  const availableUsers = allUsers.filter(user => !editorUserIds.has(user.id));

  return (
    <Suspense fallback={<Loading />}>
      <AssignProjectClient
        project={project}
        currentEditors={currentEditors}
        availableUsers={availableUsers}
      />
    </Suspense>
  );
}
