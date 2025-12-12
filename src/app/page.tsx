'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/cookies';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    
    if (token) {
      router.replace('/home');
    } else {
      router.replace('/auth/signin');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-4">Fast Track Projects</h1>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}