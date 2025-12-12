# PWA Push Notifications Implementation Guide

> **إشعارات الدفع للموبايل** - دليل شامل لتنفيذ إشعارات الدفع مع قائمة الإشعارات

## Overview

هذا الدليل يغطي:
1. **Push Notifications** - إشعارات تظهر حتى لو التطبيق مغلق
2. **Notification List** - قائمة الإشعارات داخل التطبيق
3. **Real-time Updates** - تحديث فوري عند تغيير حالة الطلب

### Browser/Platform Support

| Platform | Push Notifications | Notes |
|----------|-------------------|-------|
| Android Chrome | ✅ | Full support |
| Android Firefox | ✅ | Full support |
| iOS Safari 16.4+ | ✅ | **Must be installed as PWA** |
| Desktop Chrome | ✅ | Full support |
| Desktop Firefox | ✅ | Full support |
| Desktop Safari | ✅ | macOS Ventura+ |

> ⚠️ **iOS Requirement**: User must "Add to Home Screen" first, then grant notification permission

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PUSH NOTIFICATION FLOW                             │
└─────────────────────────────────────────────────────────────────────────────┘

1. SUBSCRIPTION FLOW:
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Browser    │ ───▶ │  Service     │ ───▶ │  Next.js API │
│   (Client)   │      │  Worker      │      │  /subscribe  │
└──────────────┘      └──────────────┘      └──────────────┘
                                                   │
                                                   ▼
                                            ┌──────────────┐
                                            │   Supabase   │
                                            │ (Save Sub)   │
                                            └──────────────┘

2. NOTIFICATION FLOW:
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Supabase   │ ───▶ │  Webhook/    │ ───▶ │  Next.js API │
│  (Trigger)   │      │  Realtime    │      │ /send-push   │
└──────────────┘      └──────────────┘      └──────────────┘
                                                   │
                                                   ▼
                                            ┌──────────────┐
                                            │  Web Push    │
                                            │  Service     │
                                            └──────────────┘
                                                   │
                                                   ▼
                                            ┌──────────────┐
                                            │   Device     │
                                            │ (Shows Notif)│
                                            └──────────────┘
```

---

## Database Schema

### New Table: `push_subscriptions`

```sql
-- Migration: Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    device_info JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
```

### New Table: `notifications`

```sql
-- Migration: Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'order_update',
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

### Supabase Migration File

Create: `supabase/migrations/20251206120000_add_push_notifications.sql`

```sql
-- Push Subscriptions Table
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    device_info JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'order_update',
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

---

## 1. Generate VAPID Keys

VAPID keys are required for Web Push. Generate them once:

```bash
# Install web-push globally
npm install -g web-push

# Generate VAPID keys
web-push generate-vapid-keys
```

Output:
```
Public Key: BNxfi...your-public-key...
Private Key: your-private-key
```

### Environment Variables

```env
# .env.local (Server-side)
SUPABASE_URL=https://ikhznagivsbcbggvppnt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# VAPID Keys for Web Push
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BNxfi...your-public-key...
VAPID_PRIVATE_KEY=your-private-key
VAPID_SUBJECT=mailto:admin@fast-track.com
```

---

## 2. Service Worker

### public/sw.js

```javascript
// Service Worker for Push Notifications

const CACHE_NAME = 'ft-purchase-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
});

// Push event - when notification is received
self.addEventListener('push', (event) => {
  console.log('Push received:', event);

  let data = {
    title: 'Fast Track Projects',
    body: 'لديك إشعار جديد',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    data: {}
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192.png',
    badge: data.badge || '/icons/badge-72.png',
    vibrate: [100, 50, 100],
    dir: 'rtl',
    lang: 'ar',
    tag: data.tag || 'default',
    renotify: true,
    requireInteraction: data.requireInteraction || false,
    data: data.data || {},
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  const data = event.notification.data;
  let url = '/';

  // Navigate to specific order if available
  if (data.orderId) {
    url = `/orders/${data.orderId}`;
  } else if (data.url) {
    url = data.url;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // Open new window if not
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
});
```

---

## 3. Push Subscription API

### app/api/push/subscribe/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function validateToken(token: string) {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, role, name, is_active')
    .eq('auth_token', token)
    .single();

  if (error || !user || !user.is_active) return null;
  return user;
}

export async function POST(request: NextRequest) {
  try {
    // Validate auth token
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

    // Get subscription data
    const body = await request.json();
    const { subscription, deviceInfo } = body;

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json(
        { code: 400, message: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    // Save or update subscription
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        device_info: deviceInfo || {},
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'endpoint'
      })
      .select()
      .single();

    if (error) {
      console.error('Subscription save error:', error);
      return NextResponse.json(
        { code: 500, message: 'Failed to save subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      code: 200,
      message: 'تم تفعيل الإشعارات بنجاح',
      data: { subscriptionId: data.id }
    });

  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json(
      { code: 500, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Unsubscribe
export async function DELETE(request: NextRequest) {
  try {
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

    const { endpoint } = await request.json();

    if (endpoint) {
      // Delete specific subscription
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('endpoint', endpoint);
    } else {
      // Delete all user subscriptions
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id);
    }

    return NextResponse.json({
      code: 200,
      message: 'تم إلغاء الإشعارات بنجاح'
    });

  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json(
      { code: 500, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 4. Send Push Notification API

### app/api/push/send/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Configure web-push
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  orderId?: string;
  orderTitle?: string;
  orderStatus?: string;
  type?: string;
}

async function validateToken(token: string) {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, role, is_active')
    .eq('auth_token', token)
    .single();

  if (error || !user || !user.is_active) return null;
  return user;
}

async function sendPushToUser(userId: string, payload: any) {
  // Get all user's push subscriptions
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId);

  if (error || !subscriptions?.length) {
    console.log('No subscriptions found for user:', userId);
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;
  const invalidEndpoints: string[] = [];

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        },
        JSON.stringify(payload)
      );
      sent++;
    } catch (err: any) {
      console.error('Push failed for endpoint:', sub.endpoint, err);
      failed++;
      
      // Remove invalid subscriptions (410 Gone or 404 Not Found)
      if (err.statusCode === 410 || err.statusCode === 404) {
        invalidEndpoints.push(sub.endpoint);
      }
    }
  }

  // Clean up invalid subscriptions
  if (invalidEndpoints.length > 0) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .in('endpoint', invalidEndpoints);
  }

  return { sent, failed };
}

export async function POST(request: NextRequest) {
  try {
    // This endpoint can be called from:
    // 1. Internal triggers (with service key)
    // 2. Admin users (with auth token)
    
    const authHeader = request.headers.get('Authorization');
    const serviceKey = request.headers.get('X-Service-Key');
    
    // Validate either service key or admin token
    if (serviceKey !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
      if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json(
          { code: 401, message: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      const token = authHeader.replace('Bearer ', '');
      const user = await validateToken(token);
      
      if (!user || !['admin', 'sub-admin'].includes(user.role)) {
        return NextResponse.json(
          { code: 403, message: 'Forbidden' },
          { status: 403 }
        );
      }
    }

    const body: NotificationPayload = await request.json();
    const { userId, title, body: notifBody, orderId, orderTitle, orderStatus, type } = body;

    if (!userId || !title || !notifBody) {
      return NextResponse.json(
        { code: 400, message: 'Missing required fields: userId, title, body' },
        { status: 400 }
      );
    }

    // 1. Save notification to database
    const { data: notification, error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        order_id: orderId || null,
        title: title,
        body: notifBody,
        type: type || 'order_update',
        data: {
          orderTitle,
          orderStatus
        }
      })
      .select()
      .single();

    if (notifError) {
      console.error('Failed to save notification:', notifError);
    }

    // 2. Send push notification
    const pushPayload = {
      title,
      body: notifBody,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      tag: orderId || 'notification',
      data: {
        orderId,
        orderTitle,
        orderStatus,
        notificationId: notification?.id,
        url: orderId ? `/orders/${orderId}` : '/notifications'
      }
    };

    const result = await sendPushToUser(userId, pushPayload);

    return NextResponse.json({
      code: 200,
      message: 'Notification sent',
      data: {
        notificationId: notification?.id,
        pushResult: result
      }
    });

  } catch (error) {
    console.error('Send notification error:', error);
    return NextResponse.json(
      { code: 500, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 5. Notifications List API

### app/api/notifications/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function validateToken(token: string) {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, role, is_active')
    .eq('auth_token', token)
    .single();

  if (error || !user || !user.is_active) return null;
  return user;
}

// GET - Fetch user notifications
export async function GET(request: NextRequest) {
  try {
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

    // Get query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unread') === 'true';

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('notifications')
      .select(`
        *,
        orders:order_id (
          id,
          order_name,
          status
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data: notifications, count, error } = await query;

    if (error) {
      console.error('Fetch notifications error:', error);
      return NextResponse.json(
        { code: 500, message: 'Failed to fetch notifications' },
        { status: 500 }
      );
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    return NextResponse.json({
      code: 200,
      data: {
        notifications,
        unreadCount: unreadCount || 0,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }
    });

  } catch (error) {
    console.error('Notifications error:', error);
    return NextResponse.json(
      { code: 500, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
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

    const { notificationIds, markAll } = await request.json();

    if (markAll) {
      // Mark all as read
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
    } else if (notificationIds?.length > 0) {
      // Mark specific notifications as read
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .in('id', notificationIds);
    }

    return NextResponse.json({
      code: 200,
      message: 'تم تحديث الإشعارات بنجاح'
    });

  } catch (error) {
    console.error('Mark read error:', error);
    return NextResponse.json(
      { code: 500, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete notifications
export async function DELETE(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');
    const deleteAll = searchParams.get('all') === 'true';

    if (deleteAll) {
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);
    } else if (notificationId) {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);
    }

    return NextResponse.json({
      code: 200,
      message: 'تم حذف الإشعارات بنجاح'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    return NextResponse.json(
      { code: 500, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 6. Client-Side: Push Registration Hook

### hooks/usePushNotifications.ts

```typescript
'use client';

import { useState, useCallback, useEffect } from 'react';

interface UsePushNotificationsOptions {
  authToken: string;
  vapidPublicKey: string;
  onPermissionDenied?: () => void;
}

export function usePushNotifications({
  authToken,
  vapidPublicKey,
  onPermissionDenied
}: UsePushNotificationsOptions) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Check support on mount
  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);
    
    if (supported && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Check existing subscription
  useEffect(() => {
    async function checkSubscription() {
      if (!isSupported) return;
      
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (err) {
        console.error('Check subscription error:', err);
      }
    }
    
    checkSubscription();
  }, [isSupported]);

  // Convert VAPID key to Uint8Array
  const urlBase64ToUint8Array = useCallback((base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!isSupported || !authToken) return false;
    
    setIsLoading(true);
    
    try {
      // Request permission
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission !== 'granted') {
        onPermissionDenied?.();
        return false;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      // Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language
          }
        })
      });

      const data = await response.json();
      
      if (data.code === 200) {
        setIsSubscribed(true);
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Subscribe error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, authToken, vapidPublicKey, urlBase64ToUint8Array, onPermissionDenied]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!isSupported) return false;
    
    setIsLoading(true);
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        // Unsubscribe locally
        await subscription.unsubscribe();
        
        // Remove from server
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint
          })
        });
      }
      
      setIsSubscribed(false);
      return true;
    } catch (err) {
      console.error('Unsubscribe error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, authToken]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe
  };
}
```

---

## 7. Notifications List Hook

### hooks/useNotifications.ts

```typescript
'use client';

import { useState, useCallback, useEffect } from 'react';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: string;
  order_id: string | null;
  data: {
    orderTitle?: string;
    orderStatus?: string;
  };
  orders?: {
    id: string;
    order_name: string;
    status: string;
  } | null;
}

interface UseNotificationsOptions {
  authToken: string;
  pollingInterval?: number;
}

export function useNotifications({ 
  authToken, 
  pollingInterval = 30000 
}: UseNotificationsOptions) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (unreadOnly = false) => {
    if (!authToken) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        ...(unreadOnly && { unread: 'true' })
      });

      const response = await fetch(`/api/notifications?${params}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const data = await response.json();

      if (data.code === 200) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('فشل في جلب الإشعارات');
      console.error('Fetch notifications error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [authToken]);

  // Mark notifications as read
  const markAsRead = useCallback(async (notificationIds?: string[]) => {
    if (!authToken) return;

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          notificationIds,
          markAll: !notificationIds
        })
      });

      // Update local state
      if (notificationIds) {
        setNotifications(prev => 
          prev.map(n => 
            notificationIds.includes(n.id) ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
      } else {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Mark as read error:', err);
    }
  }, [authToken]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId?: string) => {
    if (!authToken) return;

    try {
      const params = notificationId ? `?id=${notificationId}` : '?all=true';
      
      await fetch(`/api/notifications${params}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (notificationId) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        const deleted = notifications.find(n => n.id === notificationId);
        if (deleted && !deleted.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Delete notification error:', err);
    }
  }, [authToken, notifications]);

  // Initial fetch and polling
  useEffect(() => {
    if (!authToken) return;

    fetchNotifications();

    const intervalId = setInterval(() => {
      fetchNotifications();
    }, pollingInterval);

    return () => clearInterval(intervalId);
  }, [authToken, pollingInterval, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refresh: fetchNotifications,
    markAsRead,
    deleteNotification
  };
}
```

---

## 8. Notification Components

### components/NotificationBell.tsx

```tsx
'use client';

import { useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationList } from './NotificationList';

interface NotificationBellProps {
  authToken: string;
}

export function NotificationBell({ authToken }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAsRead, 
    deleteNotification,
    refresh 
  } = useNotifications({ authToken });

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        title="الإشعارات"
      >
        {isLoading ? (
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        ) : (
          <Bell className="h-6 w-6" />
        )}
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Dropdown */}
          <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg border z-50 max-h-[70vh] overflow-hidden flex flex-col">
            <div className="p-3 border-b flex items-center justify-between bg-gray-50">
              <h3 className="font-semibold text-gray-900">الإشعارات</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAsRead()}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  تحديد الكل كمقروء
                </button>
              )}
            </div>
            
            <NotificationList
              notifications={notifications}
              onMarkAsRead={(id) => markAsRead([id])}
              onDelete={deleteNotification}
              onClose={() => setIsOpen(false)}
            />
          </div>
        </>
      )}
    </div>
  );
}
```

### components/NotificationList.tsx

```tsx
'use client';

import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Trash2, ExternalLink, Check } from 'lucide-react';
import Link from 'next/link';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: string;
  order_id: string | null;
  data: {
    orderTitle?: string;
    orderStatus?: string;
  };
}

interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function NotificationList({ 
  notifications, 
  onMarkAsRead, 
  onDelete,
  onClose 
}: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p>لا توجد إشعارات</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto flex-1">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-3 border-b hover:bg-gray-50 transition-colors ${
            !notification.is_read ? 'bg-blue-50' : ''
          }`}
        >
          <div className="flex items-start gap-3">
            {/* Unread indicator */}
            {!notification.is_read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
            )}
            
            <div className="flex-1 min-w-0">
              {/* Title */}
              <p className={`text-sm ${!notification.is_read ? 'font-semibold' : 'font-medium'} text-gray-900`}>
                {notification.title}
              </p>
              
              {/* Body */}
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {notification.body}
              </p>
              
              {/* Order info */}
              {notification.data?.orderTitle && (
                <p className="text-xs text-gray-500 mt-1">
                  📦 {notification.data.orderTitle}
                  {notification.data?.orderStatus && (
                    <span className="mr-2 px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                      {notification.data.orderStatus}
                    </span>
                  )}
                </p>
              )}
              
              {/* Time */}
              <p className="text-xs text-gray-400 mt-1">
                {formatDistanceToNow(new Date(notification.created_at), {
                  addSuffix: true,
                  locale: ar
                })}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {!notification.is_read && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead(notification.id);
                  }}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                  title="تحديد كمقروء"
                >
                  <Check className="h-4 w-4" />
                </button>
              )}
              
              {notification.order_id && (
                <Link
                  href={`/orders/${notification.order_id}`}
                  onClick={onClose}
                  className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                  title="عرض الطلب"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              )}
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification.id);
                }}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                title="حذف"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 9. Push Settings Component

### components/PushSettings.tsx

```tsx
'use client';

import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Bell, BellOff, Loader2, AlertCircle } from 'lucide-react';

interface PushSettingsProps {
  authToken: string;
}

export function PushSettings({ authToken }: PushSettingsProps) {
  const {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe
  } = usePushNotifications({
    authToken,
    vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    onPermissionDenied: () => {
      alert('تم رفض إذن الإشعارات. يرجى تفعيله من إعدادات المتصفح.');
    }
  });

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 p-4 bg-yellow-50 text-yellow-800 rounded-lg">
        <AlertCircle className="h-5 w-5" />
        <span>متصفحك لا يدعم إشعارات الدفع</span>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 text-red-800 rounded-lg">
        <BellOff className="h-5 w-5" />
        <div>
          <p className="font-medium">تم رفض إذن الإشعارات</p>
          <p className="text-sm">يرجى تفعيل الإشعارات من إعدادات المتصفح</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        {isSubscribed ? (
          <Bell className="h-6 w-6 text-green-600" />
        ) : (
          <BellOff className="h-6 w-6 text-gray-400" />
        )}
        <div>
          <p className="font-medium text-gray-900">
            إشعارات الدفع
          </p>
          <p className="text-sm text-gray-500">
            {isSubscribed 
              ? 'ستصلك إشعارات عند تحديث الطلبات' 
              : 'فعّل الإشعارات لتبقى على اطلاع'}
          </p>
        </div>
      </div>

      <button
        onClick={isSubscribed ? unsubscribe : subscribe}
        disabled={isLoading}
        className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
          isSubscribed
            ? 'bg-red-100 text-red-700 hover:bg-red-200'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        } disabled:opacity-50`}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isSubscribed ? (
          <>
            <BellOff className="h-4 w-4" />
            إلغاء التفعيل
          </>
        ) : (
          <>
            <Bell className="h-4 w-4" />
            تفعيل
          </>
        )}
      </button>
    </div>
  );
}
```

---

## 10. Trigger Notifications on Order Status Change

### Option A: Supabase Database Webhook

Create a webhook that triggers when order status changes:

1. Go to Supabase Dashboard → Database → Webhooks
2. Create new webhook:
   - Name: `order_status_notification`
   - Table: `orders`
   - Events: `UPDATE`
   - URL: `https://your-domain.com/api/webhooks/order-status`

### app/api/webhooks/order-status/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// Get users who should be notified based on new status
function getUsersToNotify(newStatus: string): { roles: string[], includeCreator: boolean } {
  const statusNotifications: Record<string, { roles: string[], includeCreator: boolean }> = {
    'تمت المراجعة الهندسية': { 
      roles: ['admin', 'sub-admin'], 
      includeCreator: false 
    },
    'مراجعة الطلب من الادارة': { 
      roles: ['admin', 'sub-admin'], 
      includeCreator: false 
    },
    'تمت الموافقة من الادارة': { 
      roles: ['Projects'], 
      includeCreator: true 
    },
    'تم الرفض من الادارة': { 
      roles: [], 
      includeCreator: true 
    },
    'جاري الان عملية الشراء': { 
      roles: ['admin', 'sub-admin'], 
      includeCreator: true 
    },
    'تم غلق طلب الشراء': { 
      roles: ['admin', 'sub-admin'], 
      includeCreator: true 
    },
  };

  return statusNotifications[newStatus] || { roles: [], includeCreator: false };
}

function getStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    'تمت المراجعة الهندسية': 'تمت المراجعة الهندسية للطلب',
    'مراجعة الطلب من الادارة': 'الطلب قيد المراجعة من الإدارة',
    'تمت الموافقة من الادارة': 'تمت الموافقة على الطلب ✅',
    'تم الرفض من الادارة': 'تم رفض الطلب ❌',
    'جاري الان عملية الشراء': 'جاري تنفيذ عملية الشراء',
    'تم غلق طلب الشراء': 'تم إغلاق طلب الشراء ✅',
  };
  return messages[status] || `تم تحديث حالة الطلب إلى: ${status}`;
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret (optional but recommended)
    const webhookSecret = request.headers.get('X-Webhook-Secret');
    if (webhookSecret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await request.json();
    const { type, table, record, old_record } = payload;

    // Only process order updates with status changes
    if (type !== 'UPDATE' || table !== 'orders') {
      return NextResponse.json({ message: 'Ignored' });
    }

    const newStatus = record.status;
    const oldStatus = old_record?.status;

    // Skip if status didn't change
    if (newStatus === oldStatus) {
      return NextResponse.json({ message: 'Status unchanged' });
    }

    const { roles, includeCreator } = getUsersToNotify(newStatus);
    const usersToNotify = new Set<string>();

    // Get users by role
    if (roles.length > 0) {
      const { data: roleUsers } = await supabase
        .from('users')
        .select('id')
        .in('role', roles)
        .eq('is_active', true);

      roleUsers?.forEach(u => usersToNotify.add(u.id));
    }

    // Add order creator
    if (includeCreator && record.created_by) {
      usersToNotify.add(record.created_by);
    }

    // Send notifications to all users
    const title = 'تحديث على الطلب';
    const body = getStatusMessage(newStatus);

    for (const userId of usersToNotify) {
      // 1. Save to notifications table
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          order_id: record.id,
          title,
          body,
          type: 'order_update',
          data: {
            orderTitle: record.order_name,
            orderStatus: newStatus
          }
        });

      // 2. Send push notification
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId);

      for (const sub of subscriptions || []) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth }
            },
            JSON.stringify({
              title,
              body,
              icon: '/icons/icon-192.png',
              badge: '/icons/badge-72.png',
              tag: record.id,
              data: {
                orderId: record.id,
                orderTitle: record.order_name,
                orderStatus: newStatus,
                url: `/orders/${record.id}`
              }
            })
          );
        } catch (err: any) {
          // Remove invalid subscription
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('endpoint', sub.endpoint);
          }
        }
      }
    }

    return NextResponse.json({
      message: 'Notifications sent',
      notifiedUsers: usersToNotify.size
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 11. Dependencies

Add to your `package.json`:

```json
{
  "dependencies": {
    "web-push": "^3.6.7",
    "date-fns": "^3.6.0"
  },
  "devDependencies": {
    "@types/web-push": "^3.6.3"
  }
}
```

Install:
```bash
npm install web-push date-fns
npm install -D @types/web-push
```

---

## 12. File Structure

```
app/
├── api/
│   ├── push/
│   │   ├── subscribe/
│   │   │   └── route.ts      # Subscribe/unsubscribe
│   │   └── send/
│   │       └── route.ts      # Send push notification
│   ├── notifications/
│   │   └── route.ts          # Get/mark/delete notifications
│   └── webhooks/
│       └── order-status/
│           └── route.ts      # Webhook handler

components/
├── NotificationBell.tsx      # Bell icon with dropdown
├── NotificationList.tsx      # List of notifications
└── PushSettings.tsx          # Enable/disable push

hooks/
├── usePushNotifications.ts   # Push subscription hook
└── useNotifications.ts       # Notifications list hook

public/
├── sw.js                     # Service Worker
├── manifest.json
└── icons/
    ├── icon-192.png
    ├── icon-512.png
    └── badge-72.png          # Badge icon for notifications

supabase/
└── migrations/
    └── 20251206120000_add_push_notifications.sql
```

---

## 13. API Summary

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/push/subscribe` | POST | Subscribe to push | Required |
| `/api/push/subscribe` | DELETE | Unsubscribe | Required |
| `/api/push/send` | POST | Send push notification | Admin/Service |
| `/api/notifications` | GET | Get notifications list | Required |
| `/api/notifications` | PATCH | Mark as read | Required |
| `/api/notifications` | DELETE | Delete notification | Required |
| `/api/webhooks/order-status` | POST | Webhook for status changes | Webhook Secret |

---

## 14. Notification Flow by Role

| Status Change | Notified Roles | Creator Notified |
|---------------|----------------|------------------|
| → تمت المراجعة الهندسية | Admin, Sub-Admin | ❌ |
| → مراجعة الطلب من الادارة | Admin, Sub-Admin | ❌ |
| → تمت الموافقة من الادارة | Projects | ✅ |
| → تم الرفض من الادارة | - | ✅ |
| → جاري الان عملية الشراء | Admin, Sub-Admin | ✅ |
| → تم غلق طلب الشراء | Admin, Sub-Admin | ✅ |

---

## 15. Testing

### Test Push Subscription
```bash
# Subscribe
curl -X POST http://localhost:3000/api/push/subscribe \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"subscription": {...}, "deviceInfo": {}}'
```

### Test Send Notification
```bash
curl -X POST http://localhost:3000/api/push/send \
  -H "X-Service-Key: YOUR_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "title": "تحديث على الطلب",
    "body": "تمت الموافقة على طلبك",
    "orderId": "order-uuid",
    "orderTitle": "طلب مواد بناء",
    "orderStatus": "تمت الموافقة من الادارة"
  }'
```

### Test Notifications API
```bash
# Get notifications
curl http://localhost:3000/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"

# Mark as read
curl -X PATCH http://localhost:3000/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"markAll": true}'
```

---

## Key Points

✅ **Push Notifications** - Works on Android, iOS (PWA), and Desktop  
✅ **Notification List** - Shows order title and status  
✅ **Real-time Triggers** - Via Supabase webhooks on status change  
✅ **Role-based** - Different roles get different notifications  
✅ **Persistent Storage** - Notifications saved in database  
✅ **Mark as Read** - Individual or all at once  
✅ **Click to Navigate** - Opens specific order on click  
✅ **Auto Cleanup** - Invalid subscriptions removed automatically
