# 🔔 FCM Push Notifications Guide

## Overview

This project uses **Firebase Cloud Messaging (FCM)** to send push notifications to users based on order status changes. Notifications are controlled entirely by order status - no additional conditions affect the logic.

---

## 📊 Notification Flow by Status

| Order Status | Triggered By | Recipients |
|--------------|--------------|------------|
| `تم اجراء الطلب` (Order Created) | Site | **Engineering** only |
| `تمت المراجعة الهندسية` (Engineering Review Done) | Engineering | **Site** (creator) + **Admin** |
| `مراجعة الطلب من الادارة` (Admin Review) | Admin | **Site** (creator) + **Engineering** |
| `تمت الموافقة من الادارة` (Admin Approved) | Admin | **Purchasing** + **Site** + **Engineering** |
| `تم الرفض من الادارة` (Admin Rejected) | Admin | **Site** + **Engineering** (NOT Purchasing) |
| `جاري الان عملية الشراء` (Purchasing In Progress) | Purchasing | **ALL roles** |
| `تم غلق طلب الشراء` (Order Closed) | Purchasing | **ALL roles** |

### Key Rules

1. **Admin does NOT receive notifications when orders are created** - Only Engineering gets notified
2. **Purchasing does NOT receive rejection notifications** - Only approved orders go to Purchasing
3. **Site (creator) always receives notifications** about their order after the initial creation
4. **Purchasing updates notify everyone** - All roles are informed when purchase status changes

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│  Next.js API     │────▶│  Supabase       │
│   (React)       │     │  Routes          │     │  Edge Functions │
└────────┬────────┘     └──────────────────┘     └────────┬────────┘
         │                                                 │
         │  FCM Token                                      │  Send FCM
         │                                                 │
         ▼                                                 ▼
┌─────────────────┐                              ┌─────────────────┐
│  Firebase       │◀─────────────────────────────│  Firebase       │
│  (Browser SDK)  │      Push Notification       │  Admin SDK      │
└─────────────────┘                              └─────────────────┘
```

---

## 🔑 FCM Token Lifecycle

### 1. Token Generation

When a user enables notifications, the browser generates an FCM token:

```typescript
// src/lib/firebase.ts
const token = await getToken(messaging, {
  vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
  serviceWorkerRegistration: await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js'),
});
```

### 2. Token Registration

The token is sent to the backend and stored in the `fcm_tokens` table:

```typescript
// Frontend calls
POST /api/push/subscribe
{
  "fcmToken": "token-from-firebase",
  "deviceInfo": { "platform": "web" }
}

// Backend stores in Supabase
INSERT INTO fcm_tokens (user_id, fcm_token, device_info)
```

### 3. Token Usage

When a notification needs to be sent, the backend:

1. Queries `fcm_tokens` table for user tokens
2. Sends FCM message via HTTP v1 API
3. FCM delivers to the user's browser

### 4. Token Deletion (Logout)

```typescript
// Frontend calls on logout
DELETE /api/push/unsubscribe
{
  "fcmToken": "token-to-remove"
}
```

---

## 📁 File Structure

```
src/
├── lib/
│   └── firebase.ts                    # Firebase initialization & token management
├── components/
│   └── providers/
│       └── FCMProvider.tsx            # FCM context provider for React
│   └── notifications/
│       └── NotificationPermissionPrompt.tsx  # UI for requesting permission
├── hooks/
│   └── useFirebasePush.ts             # Hook for FCM operations
│   └── useNotifications.ts            # Hook for notification list
├── app/
│   └── api/
│       └── push/
│           ├── subscribe/route.ts     # Register FCM token
│           └── unsubscribe/route.ts   # Remove FCM token
│       └── webhooks/
│           └── order-status/route.ts  # Webhook for status changes
public/
├── firebase-messaging-sw.js           # Service worker for background notifications
└── sw.js                              # General service worker
```

---

## ⚙️ Firebase Setup Requirements

### 1. Firebase Console Setup

1. Create project at [Firebase Console](https://console.firebase.google.com)
2. Enable Cloud Messaging
3. Get Web Push Certificate (VAPID Key):
   - Project Settings → Cloud Messaging → Web Push certificates
   - Generate or copy the existing key pair

### 2. Environment Variables (Frontend)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key
```

### 3. Service Account (Backend - Supabase)

1. Firebase Console → Project Settings → Service Accounts
2. Generate new private key (JSON file)
3. Store as `FCM_SERVICE_ACCOUNT` secret in Supabase

### 4. Service Worker

The file `public/firebase-messaging-sw.js` must exist and be accessible at the root:

```javascript
// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  // Your config here
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/icons/icon-192x192.png',
    // ... options
  });
});
```

---

## 🔄 Status-Based Notification Logic

The notification targets are defined in `src/lib/services/notifications/types.ts`:

```typescript
export const STATUS_NOTIFICATION_MAP: Record<string, NotificationTargets> = {
  // Site creates order → Engineering only
  'تم اجراء الطلب': {
    roles: ['engineering'],
    includeCreator: false,
  },
  
  // Engineering done → Site + Admin
  'تمت المراجعة الهندسية': {
    roles: ['admin', 'sub-admin'],
    includeCreator: true,
  },
  
  // Admin review → Site + Engineering
  'مراجعة الطلب من الادارة': {
    roles: ['engineering'],
    includeCreator: true,
  },
  
  // Approved → Purchasing + Site + Engineering
  'تمت الموافقة من الادارة': {
    roles: ['purchasing', 'engineering'],
    includeCreator: true,
  },
  
  // Rejected → Site + Engineering (NOT Purchasing)
  'تم الرفض من الادارة': {
    roles: ['engineering'],
    includeCreator: true,
  },
  
  // Purchasing → ALL
  'جاري الان عملية الشراء': {
    roles: ['admin', 'sub-admin', 'engineering', 'site'],
    includeCreator: true,
  },
  
  // Closed → ALL
  'تم غلق طلب الشراء': {
    roles: ['admin', 'sub-admin', 'engineering', 'site'],
    includeCreator: true,
  },
};
```

---

## 🧪 Testing Notifications

### Method 1: Admin Test Endpoint

```bash
curl -X POST "https://your-supabase-url/functions/v1/test-fcm" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Notification",
    "body": "This is a test message",
    "user_id": "<optional-target-user-id>"
  }'
```

### Method 2: Create a Test Order

1. Login as Site user
2. Create a new order
3. Engineering should receive notification

### Method 3: Status Change Flow

1. Login as Engineering
2. Update order status to "تمت المراجعة الهندسية"
3. Site (creator) and Admin should receive notifications

### Verify Token Registration

Check if user has FCM token registered:

```sql
SELECT * FROM fcm_tokens WHERE user_id = 'user-uuid';
```

---

## 🐛 Troubleshooting

### Notifications Not Received

| Issue | Solution |
|-------|----------|
| No FCM token in database | Check if user enabled notifications |
| Service worker not registered | Verify `/firebase-messaging-sw.js` is accessible |
| Permission denied | User needs to allow notifications in browser |
| Token invalid | Token may have expired - re-register |
| Wrong VAPID key | Verify `NEXT_PUBLIC_FIREBASE_VAPID_KEY` matches Firebase console |

### Background Notifications Not Working

1. **Service worker must be at root**: `https://yourdomain.com/firebase-messaging-sw.js`
2. **HTTPS required**: FCM only works on secure origins
3. **Browser tab must be closed or unfocused** for background notifications

### Foreground Notifications Not Showing

The `FCMProvider` handles foreground messages:

```typescript
// src/components/providers/FCMProvider.tsx
onMessage(messaging, (payload) => {
  // Show toast notification
  toast(title, { description: body });
});
```

If toasts aren't showing, verify:
- `FCMProvider` is wrapped around your app
- `Toaster` component is included in layout

### Token Mismatch

If notifications go to wrong device:
- User may have multiple tokens (multiple browsers/devices)
- Clear old tokens: `DELETE FROM fcm_tokens WHERE user_id = 'user-uuid'`
- Re-register token on login

---

## 📱 PWA Considerations

For the best notification experience as a PWA:

1. **Install the app**: Add to Home Screen
2. **Grant permission**: Allow notifications when prompted
3. **Keep service worker updated**: App will auto-update

### Badge Count

The app also supports app badge counts for unread notifications:

```typescript
// Updates badge on home screen icon
navigator.setAppBadge(unreadCount);
```

---

## 🔐 Security

1. **Tokens are user-specific**: Each token is linked to a `user_id`
2. **Authentication required**: All API endpoints require valid session token
3. **Service account secret**: FCM credentials stored securely in Supabase secrets
4. **No client exposure**: FCM Admin SDK only runs server-side

---

## 📚 Related Documentation

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
