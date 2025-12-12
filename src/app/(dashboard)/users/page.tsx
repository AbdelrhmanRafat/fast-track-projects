import React from 'react';
import UsersClient from './pageClient';
import { getUsers } from '@/lib/services/users';
import type { User } from '@/lib/services/users/types';

export default async function UsersPage() {
  // Fetch users server-side using NetworkLayer
  const usersResponse = await getUsers();
  // Extract users data - handle different response structures
  // API might return: { data: { data: User[] } } or { data: User[] }
  let users: User[] = [];
  
  if (usersResponse?.data) {
    const responseData = usersResponse.data;
    // Check if data is nested (data.data) or direct array
    if (Array.isArray(responseData)) {
      users = responseData;
    } else if (responseData.data && Array.isArray(responseData.data)) {
      users = responseData.data;
    }
  }

  return (
    <main>
      <UsersClient users={users} />
    </main>
  );
}