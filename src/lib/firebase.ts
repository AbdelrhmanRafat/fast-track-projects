/**
 * Firebase Configuration and Initialization
 * 
 * This file sets up Firebase for push notifications using Firebase Cloud Messaging (FCM)
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging, isSupported } from 'firebase/messaging';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase app (singleton pattern)
let firebaseApp: FirebaseApp | null = null;
let messaging: Messaging | null = null;

/**
 * Initialize Firebase app
 */
export function initializeFirebase(): FirebaseApp | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    // Check if Firebase is already initialized
    if (getApps().length === 0) {
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      firebaseApp = getApps()[0];
    }
    return firebaseApp;
  } catch (error) {
    return null;
  }
}

/**
 * Get Firebase Messaging instance
 */
export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  if (messaging) {
    return messaging;
  }

  try {
    // Check if messaging is supported
    const supported = await isSupported();
    if (!supported) {
      return null;
    }

    const app = initializeFirebase();
    if (!app) {
      return null;
    }

    messaging = getMessaging(app);
    return messaging;
  } catch (error) {
    return null;
  }
}

/**
 * Request permission and get FCM token
 */
export async function requestNotificationPermissionAndGetToken(): Promise<string | null> {
  try {
    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      return null;
    }

    // Get messaging instance
    const messagingInstance = await getFirebaseMessaging();
    if (!messagingInstance) {
      return null;
    }

    // Get FCM token
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    
    if (!vapidKey) {
      return null;
    }

    const token = await getToken(messagingInstance, {
      vapidKey,
      serviceWorkerRegistration: await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js'),
    });
    
    return token;
  } catch (error) {
    return null;
  }
}

/**
 * Get existing FCM token without requesting permission
 */
export async function getExistingToken(): Promise<string | null> {
  try {
    if (Notification.permission !== 'granted') {
      return null;
    }

    const messagingInstance = await getFirebaseMessaging();
    if (!messagingInstance) {
      return null;
    }

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    
    if (!vapidKey) {
      return null;
    }

    const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    if (!registration) {
      return null;
    }

    const token = await getToken(messagingInstance, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });
    
    return token;
  } catch (error) {
    return null;
  }
}

/**
 * Listen for foreground messages
 */
export function onForegroundMessage(callback: (payload: any) => void): (() => void) | null {
  if (typeof window === 'undefined') {
    return null;
  }

  getFirebaseMessaging().then((messagingInstance) => {
    if (!messagingInstance) {
      return;
    }

    onMessage(messagingInstance, (payload) => {
      callback(payload);
    });
  });

  return () => {};
}

/**
 * Check if FCM is supported
 */
export async function isFCMSupported(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return await isSupported();
  } catch {
    return false;
  }
}
