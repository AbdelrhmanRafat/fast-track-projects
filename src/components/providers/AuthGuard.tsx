'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { verifyLogin } from '@/lib/services/auth/services';
import { clearAuthCookies, getToken } from '@/lib/cookies';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip verification on /home page
    if (pathname === '/home') {
      return;
    }

    const checkAuth = async () => {
      const token = getToken();

      // No token - redirect to sign in
      if (!token) {
        router.replace('/auth/signin');
        return;
      }

      // Verify token with API
      const result = await verifyLogin();

      // Check if verification failed (null result, non-200 status, or isValid is false)
      if (!result || result.status !== 200 || !result.data?.isValid) {
        // Token invalid - clear cookies and redirect to sign in
        clearAuthCookies();
        router.replace('/auth/signin');
      }
    };

    checkAuth();
  }, [router, pathname]);

  return <>{children}</>;
}
