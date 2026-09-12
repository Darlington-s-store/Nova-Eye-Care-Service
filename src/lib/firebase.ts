import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, Auth } from 'firebase/auth';
import { getMessaging, getToken, onMessage, Messaging, isSupported } from 'firebase/messaging';
import { getAnalytics, isSupported as isAnalyticsSupported, Analytics } from 'firebase/analytics';
import { apiService } from './api';

// Frontend Firebase configuration using Vite environment variables with live defaults
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyByzZYAmgdVImGaUNvvSp8tPde-jxCczIc',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'nova-eye-care.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'nova-eye-care',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'nova-eye-care.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '260223243081',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:260223243081:web:062646e48756d457548098',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-N3TL24SQKD'
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

// Initialize Firebase App safely
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let analytics: Analytics | null = null;
let messagingPromise: Promise<Messaging | null> | null = null;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  if (typeof window !== 'undefined') {
    isAnalyticsSupported().then((supported) => {
      if (supported && app) {
        analytics = getAnalytics(app);
      }
    }).catch(() => {});
  }
} catch (err) {
  console.warn('[Firebase] Initialization warning:', err);
}

// Check messaging support (requires HTTPS/localhost and Notification API)
const initMessaging = async (): Promise<Messaging | null> => {
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const supported = await isSupported();
    if (supported && app) {
      return getMessaging(app);
    }
  } catch (err) {
    console.warn('[Firebase] Messaging not supported on this browser:', err);
  }
  return null;
};

messagingPromise = initMessaging();

/**
 * Determine device type (mobile, tablet, or desktop)
 */
export const getDevicePlatform = (): 'mobile' | 'tablet' | 'desktop' => {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent.toLowerCase();
  if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    return /ipad|tablet/i.test(ua) ? 'tablet' : 'mobile';
  }
  return 'desktop';
};

/**
 * Request permission for mobile/desktop push notifications and register FCM token
 */
export const requestPushNotificationPermission = async (): Promise<{
  success: boolean;
  token?: string;
  error?: string;
}> => {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return { success: false, error: 'Push notifications are not supported on this device or browser.' };
    }

    // Request browser notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'Notification permission was denied by the user.' };
    }

    // Register service worker if not already registered
    let swRegistration: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator) {
      try {
        swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/'
        });
        await navigator.serviceWorker.ready;
      } catch (swErr) {
        console.warn('[Firebase] SW registration fallback:', swErr);
      }
    }

    const messaging = await messagingPromise;
    if (!messaging) {
      return {
        success: false,
        error: 'Firebase Cloud Messaging is not available in this environment. Ensure valid Firebase configuration.'
      };
    }

    // Retrieve FCM device token
    const tokenOptions: { vapidKey?: string; serviceWorkerRegistration?: ServiceWorkerRegistration } = {};
    if (VAPID_KEY) tokenOptions.vapidKey = VAPID_KEY;
    if (swRegistration) tokenOptions.serviceWorkerRegistration = swRegistration;

    const currentToken = await getToken(messaging, tokenOptions);

    if (!currentToken) {
      return {
        success: false,
        error: 'No registration token available. Request permission to generate one.'
      };
    }

    // Register token with Nova backend
    const platform = getDevicePlatform();
    const deviceName = `${navigator.platform || 'Device'} (${navigator.userAgent.slice(0, 40)}...)`;

    await apiService.notifications.registerDeviceToken({
      token: currentToken,
      platform,
      deviceName
    });

    localStorage.setItem('nova_fcm_token', currentToken);
    localStorage.setItem('nova_push_enabled', 'true');

    return { success: true, token: currentToken };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Firebase] Error enabling push notifications:', message);
    return { success: false, error: message };
  }
};

/**
 * Unregister device push notification token
 */
export const unregisterPushNotifications = async (): Promise<boolean> => {
  try {
    const existingToken = localStorage.getItem('nova_fcm_token');
    if (existingToken) {
      await apiService.notifications.unregisterDeviceToken({ token: existingToken });
      localStorage.removeItem('nova_fcm_token');
      localStorage.setItem('nova_push_enabled', 'false');
    }
    return true;
  } catch (err) {
    console.error('[Firebase] Failed to unregister device token:', err);
    return false;
  }
};

/**
 * Listen for foreground push notifications (when web app is active in tab)
 */
export const onForegroundMessageListener = (callback: (payload: unknown) => void) => {
  return messagingPromise?.then((messaging) => {
    if (messaging) {
      return onMessage(messaging, (payload) => {
        callback(payload);
      });
    }
  });
};

/**
 * Google Auth popup helper using Firebase Client
 */
export const signInWithGoogleFirebase = async () => {
  if (!auth) throw new Error('Firebase Auth is not initialized');
  const provider = new GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');
  const result = await signInWithPopup(auth, provider);
  const idToken = await result.user.getIdToken();
  return {
    user: result.user,
    idToken
  };
};

export { app, auth, analytics, messagingPromise };
