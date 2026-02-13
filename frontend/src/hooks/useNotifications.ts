import { useState, useEffect, useCallback } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { getMessagingInstance, isFirebaseConfigured } from '../lib/firebase';

interface NotificationState {
  permission: NotificationPermission;
  token: string | null;
  supported: boolean;
  loading: boolean;
  error: string | null;
}

export function useNotifications() {
  const [state, setState] = useState<NotificationState>({
    permission: 'default',
    token: null,
    supported: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const checkSupport = async () => {
      // Check if notifications are supported (ensure Notification exists and is truthy)
      const notificationExists = typeof window !== 'undefined' && 
        'Notification' in window && 
        window.Notification !== undefined;
      const supported = notificationExists && 'serviceWorker' in navigator;
      
      setState((prev) => ({
        ...prev,
        supported,
        permission: supported && notificationExists ? Notification.permission : 'denied',
        loading: false,
      }));
    };

    checkSupport();
  }, []);

  const requestPermission = useCallback(async () => {
    if (!state.supported) {
      setState((prev) => ({ ...prev, error: 'Notifications not supported' }));
      return null;
    }

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      // Request notification permission
      const permission = await Notification.requestPermission();
      setState((prev) => ({ ...prev, permission }));

      if (permission !== 'granted') {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: 'Notification permission denied',
        }));
        return null;
      }

      // Only try to get FCM token if Firebase is configured
      if (!isFirebaseConfigured) {
        setState((prev) => ({
          ...prev,
          loading: false,
          // Not an error - just guest mode without push
        }));
        return null;
      }

      // Get FCM token
      const messaging = await getMessagingInstance();
      if (!messaging) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: 'Firebase Messaging not available',
        }));
        return null;
      }

      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
      const token = await getToken(messaging, { vapidKey });

      setState((prev) => ({ ...prev, token, loading: false }));
      
      console.log('FCM Token:', token);
      return token;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get notification token';
      setState((prev) => ({ ...prev, loading: false, error: message }));
      console.error('Notification error:', error);
      return null;
    }
  }, [state.supported]);

  // Listen for foreground messages
  useEffect(() => {
    if (!isFirebaseConfigured) return;

    let unsubscribe: (() => void) | undefined;

    const setupListener = async () => {
      const messaging = await getMessagingInstance();
      if (!messaging) return;

      unsubscribe = onMessage(messaging, (payload) => {
        console.log('Foreground message:', payload);
        
        // Show notification manually for foreground messages
        if (Notification.permission === 'granted' && payload.notification) {
          new Notification(payload.notification.title || 'Pomodoro Timer', {
            body: payload.notification.body,
            icon: '/icons/icon-192.svg',
          });
        }
      });
    };

    setupListener();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return {
    ...state,
    requestPermission,
    isFirebaseConfigured,
  };
}
