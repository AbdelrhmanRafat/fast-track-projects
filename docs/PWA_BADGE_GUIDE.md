# PWA App Badge Implementation Guide

> **ملاحظة**: هذا الدليل يستخدم SSR مع API Routes للأمان - الـ Client لا يتصل مباشرة بـ Supabase

## Overview

App Badge API يسمح بإظهار عداد على أيقونة التطبيق مثل تطبيقات الموبايل الأصلية.

### Browser Support
| Browser | Desktop | Mobile |
|---------|---------|--------|
| Chrome | ✅ | ✅ Android |
| Edge | ✅ | ✅ |
| Safari | ❌ | ❌ iOS |
| Firefox | ❌ | ❌ |

> ⚠️ **iOS Safari لا يدعم App Badge API** - يعمل فقط على Android و Desktop

---

## Security Architecture 🔒

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Browser/PWA   │ ──────▶ │  Next.js API    │ ──────▶ │    Supabase     │
│   (Client)      │         │  Routes (SSR)   │         │   (Database)    │
└─────────────────┘         └─────────────────┘         └─────────────────┘
        │                           │                           │
   Auth Token              SERVICE_ROLE_KEY              Direct DB Access
   (Custom Auth)           (Server-side only)            (Secure)
```

**لماذا هذا الأسلوب آمن؟**
- ✅ الـ Client لا يرى أي Supabase keys
- ✅ كل الـ queries تمر عبر الـ Server
- ✅ الـ Token يُتحقق منه في كل request
- ✅ يعمل مع Custom Token Authentication

---

## 1. PWA Setup

### manifest.json
```json
{
  "name": "Fast Track Purchasing",
  "short_name": "FT Purchase",
  "description": "نظام إدارة طلبات الشراء",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0066cc",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Next.js Layout Setup (app/layout.tsx)
```tsx
export const metadata = {
  manifest: '/manifest.json',
  themeColor: '#0066cc',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FT Purchase',
  },
};
```

---

## 2. Badge Utility Functions

### lib/badge.ts
```typescript
/**
 * Check if App Badge API is supported
 */
export function isBadgeSupported(): boolean {
  return 'setAppBadge' in navigator && 'clearAppBadge' in navigator;
}

/**
 * Set badge count on app icon
 */
export async function setBadge(count: number): Promise<boolean> {
  if (!isBadgeSupported()) {
    console.log('App Badge API not supported');
    return false;
  }

  try {
    if (count > 0) {
      await navigator.setAppBadge(count);
    } else {
      await navigator.clearAppBadge();
    }
    return true;
  } catch (error) {
    console.error('Failed to set badge:', error);
    return false;
  }
}

/**
 * Clear badge from app icon
 */
export async function clearBadge(): Promise<boolean> {
  if (!isBadgeSupported()) return false;
  
  try {
    await navigator.clearAppBadge();
    return true;
  } catch (error) {
    console.error('Failed to clear badge:', error);
    return false;
  }
}
```

---

## 3. Server-Side API Route (Secure) 🔒

### app/api/badge-count/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side only - NEVER expose these to client
const supabase = createClient(
  process.env.SUPABASE_URL!,           // Not NEXT_PUBLIC_
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role for full access
);

/**
 * Get statuses that require action for each role
 */
function getStatusesForRole(role: string): string[] {
  const roleStatuses: Record<string, string[]> = {
    'مدير تنفيذي': ['طلب جديد'],
    'محاسب': ['تمت الموافقة من المدير التنفيذي'],
    'مالك': ['تمت الموافقة من المحاسب'],
    'مسؤول المشتريات': ['تمت الموافقة من الادارة', 'جاري الان عملية الشراء'],
    'مشرف': [],
    'ادمن': ['طلب جديد', 'تمت الموافقة من المدير التنفيذي', 'تمت الموافقة من المحاسب', 'تمت الموافقة من الادارة'],
  };
  return roleStatuses[role] || [];
}

/**
 * Validate auth token and get user
 */
async function validateToken(token: string) {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, role, account_name')
    .eq('auth_token', token)
    .single();

  if (error || !user) return null;
  return user;
}

export async function GET(request: NextRequest) {
  try {
    // 1. Extract and validate token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { code: 401, message: 'Missing authorization token' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await validateToken(token);

    if (!user) {
      return NextResponse.json(
        { code: 401, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // 2. Get statuses for this role
    const statuses = getStatusesForRole(user.role);
    
    if (statuses.length === 0) {
      return NextResponse.json({
        code: 200,
        data: { count: 0, role: user.role }
      });
    }

    // 3. Count pending orders
    const { count, error } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .in('status', statuses);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { code: 500, message: 'Failed to fetch count' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      code: 200,
      data: {
        count: count || 0,
        role: user.role,
        statuses: statuses
      }
    });

  } catch (error) {
    console.error('Badge count error:', error);
    return NextResponse.json(
      { code: 500, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Environment Variables (.env.local)
```env
# Server-side only (NO NEXT_PUBLIC_ prefix)
SUPABASE_URL=https://ikhznagivsbcbggvppnt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: for client-side if needed elsewhere
NEXT_PUBLIC_API_URL=http://localhost:3000
```

> ⚠️ **NEVER use `NEXT_PUBLIC_` for SERVICE_ROLE_KEY** - it will be exposed to the browser!

---

## 4. Client-Side Hook (Secure - Uses API Route)

### hooks/useAppBadge.ts
```typescript
'use client';

import { useEffect, useState, useCallback } from 'react';
import { setBadge, clearBadge } from '@/lib/badge';

interface UseAppBadgeOptions {
  authToken: string;
  enabled?: boolean;
  pollingInterval?: number; // in milliseconds
}

interface BadgeResponse {
  code: number;
  data?: {
    count: number;
    role: string;
  };
  message?: string;
}

export function useAppBadge({ 
  authToken, 
  enabled = true, 
  pollingInterval = 30000 // 30 seconds default
}: UseAppBadgeOptions) {
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingCount = useCallback(async () => {
    if (!authToken) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/badge-count', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data: BadgeResponse = await response.json();

      if (data.code === 200 && data.data) {
        setPendingCount(data.data.count);
        setBadge(data.data.count);
      } else {
        setError(data.message || 'Failed to fetch badge count');
      }
    } catch (err) {
      setError('Network error');
      console.error('Badge fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [authToken]);

  // Initial fetch and polling
  useEffect(() => {
    if (!enabled || !authToken) return;

    // Initial fetch
    fetchPendingCount();

    // Set up polling interval
    const intervalId = setInterval(fetchPendingCount, pollingInterval);

    // Cleanup
    return () => {
      clearInterval(intervalId);
      clearBadge();
    };
  }, [enabled, authToken, pollingInterval, fetchPendingCount]);

  // Refresh when tab becomes visible
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchPendingCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, fetchPendingCount]);

  return { 
    pendingCount, 
    isLoading, 
    error, 
    refresh: fetchPendingCount 
  };
}
```

---

## 5. Badge Provider Component

### providers/BadgeProvider.tsx
```tsx
'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useAppBadge } from '@/hooks/useAppBadge';

interface BadgeContextType {
  pendingCount: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

const BadgeContext = createContext<BadgeContextType>({
  pendingCount: 0,
  isLoading: false,
  error: null,
  refresh: () => {},
});

interface BadgeProviderProps {
  children: ReactNode;
  authToken: string;
  pollingInterval?: number;
}

export function BadgeProvider({ 
  children, 
  authToken,
  pollingInterval = 30000
}: BadgeProviderProps) {
  const badge = useAppBadge({ authToken, pollingInterval });

  return (
    <BadgeContext.Provider value={badge}>
      {children}
    </BadgeContext.Provider>
  );
}

export function useBadgeContext() {
  return useContext(BadgeContext);
}
```

---

## 6. Notification Bell Component

### components/NotificationBell.tsx
```tsx
'use client';

import { useBadgeContext } from '@/providers/BadgeProvider';
import { Bell, Loader2 } from 'lucide-react';

export function NotificationBell() {
  const { pendingCount, isLoading, refresh } = useBadgeContext();

  return (
    <button 
      onClick={refresh}
      className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
      title="تحديث الإشعارات"
    >
      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      ) : (
        <Bell className="h-6 w-6" />
      )}
      
      {pendingCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 font-bold">
          {pendingCount > 99 ? '99+' : pendingCount}
        </span>
      )}
    </button>
  );
}
```

---

## 7. Role-Based Badge Logic

| الدور | Statuses للمتابعة | المعنى |
|-------|------------------|--------|
| مدير تنفيذي | طلب جديد | طلبات جديدة تحتاج موافقته |
| محاسب | تمت الموافقة من المدير التنفيذي | طلبات تحتاج مراجعة مالية |
| مالك | تمت الموافقة من المحاسب | طلبات تحتاج موافقة نهائية |
| مسؤول المشتريات | تمت الموافقة من الادارة, جاري الان عملية الشراء | طلبات جاهزة للشراء |
| ادمن | جميع الطلبات النشطة | إشراف عام |
| مشرف | - | لا يحتاج badge |

---

## 8. File Structure

```
app/
├── layout.tsx              # Add manifest link
├── api/
│   └── badge-count/
│       └── route.ts        # 🔒 Server-side API (secure)
├── providers/
│   └── BadgeProvider.tsx   # Badge context
└── (dashboard)/
    └── layout.tsx          # Wrap with BadgeProvider

components/
└── NotificationBell.tsx    # Bell icon with count

hooks/
└── useAppBadge.ts          # Polling hook (no Supabase client)

lib/
└── badge.ts                # Badge utility functions

public/
├── manifest.json           # PWA manifest
└── icons/
    ├── icon-192.png
    └── icon-512.png

# Environment files
.env.local                  # SUPABASE_SERVICE_ROLE_KEY (server-only)
```

---

## 9. Usage in App

### Dashboard Layout (app/(dashboard)/layout.tsx)
```tsx
import { BadgeProvider } from '@/providers/BadgeProvider';
import { NotificationBell } from '@/components/NotificationBell';
import { cookies } from 'next/headers';

export default async function DashboardLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  // Get auth token from cookies/session
  const cookieStore = cookies();
  const authToken = cookieStore.get('auth_token')?.value || '';

  return (
    <BadgeProvider authToken={authToken} pollingInterval={30000}>
      <div className="dashboard-layout">
        <header className="flex items-center justify-between p-4">
          <h1>Fast Track</h1>
          <NotificationBell />
        </header>
        <main>{children}</main>
      </div>
    </BadgeProvider>
  );
}
```

### Alternative: Get token from Auth Context
```tsx
'use client';

import { BadgeProvider } from '@/providers/BadgeProvider';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardLayoutClient({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const { token } = useAuth();

  if (!token) return null;

  return (
    <BadgeProvider authToken={token}>
      {children}
    </BadgeProvider>
  );
}
```

---

## 10. Testing

### Test API Route
```bash
# Test badge count endpoint
curl -X GET http://localhost:3000/api/badge-count \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"

# Expected response
{
  "code": 200,
  "data": {
    "count": 5,
    "role": "مدير تنفيذي",
    "statuses": ["طلب جديد"]
  }
}
```

### Test PWA Badge

1. **Install as PWA**: Open in Chrome → Menu → "Install App"
2. **Minimize the app** to see badge on taskbar/dock icon
3. **Change order status** in database to trigger count change
4. **Wait for polling** (default 30 seconds) or click bell to refresh
5. **Check badge count** updates on app icon

### Debug Badge Support
```typescript
// In browser console
console.log('Badge supported:', 'setAppBadge' in navigator);

// Test badge
navigator.setAppBadge(5);  // Should show "5" on app icon
navigator.clearAppBadge(); // Should clear badge
```

---

## 11. Security Checklist ✅

| Item | Status | Notes |
|------|--------|-------|
| SERVICE_ROLE_KEY in server only | ✅ | No `NEXT_PUBLIC_` prefix |
| Token validation on every request | ✅ | API route validates token |
| No Supabase client in browser | ✅ | Only API fetch calls |
| Rate limiting (optional) | ⚠️ | Consider adding for production |
| CORS configured | ✅ | Next.js handles automatically |

### Optional: Add Rate Limiting
```typescript
// app/api/badge-count/route.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '60 s'), // 10 requests per minute
});

export async function GET(request: NextRequest) {
  // Rate limit by IP or token
  const ip = request.ip ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return NextResponse.json(
      { code: 429, message: 'Too many requests' },
      { status: 429 }
    );
  }
  
  // ... rest of the handler
}
```

---

## Key Points

✅ **Secure SSR Architecture** - Supabase keys never exposed to client  
✅ **Token Validation** - Every request validates auth token  
✅ **Polling Updates** - Badge updates every 30 seconds (configurable)  
✅ **Role-specific counts** - Each role sees relevant pending items  
✅ **Graceful fallback** - Works without badge on unsupported browsers  
✅ **Tab visibility** - Refreshes when user returns to tab  
❌ **iOS not supported** - Safari doesn't support App Badge API
