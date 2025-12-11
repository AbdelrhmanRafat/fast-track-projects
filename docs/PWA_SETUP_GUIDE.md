# PWA Push Notifications & Badge Setup Guide

## Overview

This guide explains how to set up PWA Push Notifications and App Badge for the Fast Track Purchasing application.

---

## 🔔 Push Notifications Setup

### Step 1: Generate VAPID Keys

VAPID (Voluntary Application Server Identification) keys are required for web push notifications.

**Generate keys using Node.js:**
```bash
npx web-push generate-vapid-keys
```

This will output:
```
=======================================

Public Key:
BKxVhN...long_base64_string...

Private Key:
uYkB...another_base64_string...

=======================================
```

### Step 2: Configure Vercel Environment Variables

Go to your Vercel project → Settings → Environment Variables and add:

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Your public key | Used by frontend to subscribe to push |
| `VAPID_PRIVATE_KEY` | Your private key | Used by backend to send push notifications |

⚠️ **Important:** 
- `NEXT_PUBLIC_` prefix makes the variable available to the browser
- The private key should NEVER be exposed to the client

### Step 3: Configure Backend

The backend needs these endpoints to handle push subscriptions:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/push-subscriptions` | POST | Save new subscription |
| `/push-subscriptions` | DELETE | Remove subscription |
| `/push-subscriptions/send` | POST | Send push notification to user |

**Backend Environment Variables:**
```env
VAPID_PUBLIC_KEY=BKxVhN...your_public_key...
VAPID_PRIVATE_KEY=uYkB...your_private_key...
VAPID_SUBJECT=mailto:admin@fast-track.com
```

---

## 📱 How Push Notifications Work

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│   Frontend  │────▶│   Backend   │
│             │     │   (Next.js) │     │  (Supabase) │
└─────────────┘     └─────────────┘     └─────────────┘
      │                    │                   │
      │ 1. Request Permission                  │
      │◀───────────────────│                   │
      │                    │                   │
      │ 2. Subscribe to PushManager            │
      │    (uses VAPID public key)             │
      │                    │                   │
      │                    │ 3. Send subscription to backend
      │                    │──────────────────▶│
      │                    │                   │ 4. Save subscription
      │                    │                   │
      │ 5. Receive push notification           │
      │◀───────────────────────────────────────│
      │    (via Service Worker)                │
```

---

## 📛 App Badge Setup

The App Badge API shows a notification count on the PWA icon (like native mobile apps).

### Browser Support

| Browser | Desktop | Mobile |
|---------|---------|--------|
| Chrome  | ✅ Yes   | ✅ Yes (Android) |
| Edge    | ✅ Yes   | ✅ Yes |
| Safari  | ❌ No    | ❌ No (iOS) |
| Firefox | ❌ No    | ❌ No |

### Requirements

1. **Must be installed as PWA** - Badge only works when app is installed to home screen
2. **Chrome/Edge only** - Safari and Firefox don't support the Badge API
3. **Secure context** - Must be served over HTTPS

### How to Test Badge

1. Install the app to home screen:
   - Chrome: Menu → Install App
   - Mobile: "Add to Home Screen"

2. Open browser console and run:
   ```javascript
   navigator.setAppBadge(5); // Sets badge to 5
   ```

3. Check the app icon on your home screen/taskbar

---

## 🔧 Troubleshooting

### Push Notifications Not Working

1. **Check VAPID key is set:**
   Open browser console and look for:
   ```
   [Push] VAPID_PUBLIC_KEY exists: true
   ```

2. **Check Service Worker is registered:**
   ```
   [Push] Service worker registered successfully
   ```

3. **Check permission:**
   ```
   [Push] Current notification permission: granted
   ```

4. **Common errors:**
   - `لم يتم تكوين مفتاح VAPID` → VAPID key not set in Vercel
   - `تم رفض إذن الإشعارات` → User denied notification permission

### Badge Not Working

1. **Check support:**
   Open browser console:
   ```
   [Badge] Badge API supported: true
   ```

2. **Check if running as PWA:**
   ```
   [Badge] Is standalone PWA: true
   ```

3. **If both are false:**
   - App must be installed to home screen
   - Must use Chrome or Edge browser

---

## 📋 Checklist

### Vercel Environment Variables
- [ ] `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is set
- [ ] `VAPID_PRIVATE_KEY` is set (if backend on same project)

### Backend Requirements
- [ ] `/push-subscriptions` POST endpoint exists
- [ ] `/push-subscriptions` DELETE endpoint exists
- [ ] Backend VAPID keys match frontend public key
- [ ] web-push library installed on backend

### PWA Manifest
- [ ] `manifest.json` exists in `/public`
- [ ] `display: standalone` is set
- [ ] Icons are configured

### Service Worker
- [ ] `sw.js` exists in `/public`
- [ ] Handles `push` event
- [ ] Handles `notificationclick` event

---

## 🚀 Quick Start

1. **Generate VAPID keys:**
   ```bash
   npx web-push generate-vapid-keys
   ```

2. **Add to Vercel:**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - Add `VAPID_PRIVATE_KEY`

3. **Redeploy:**
   ```bash
   vercel --prod
   ```

4. **Test:**
   - Open app in Chrome
   - Click notification bell → Settings tab
   - Click "تفعيل الإشعارات" (Enable Notifications)
   - Allow notification permission
   - Check console for `[Push] Subscription successful!`
