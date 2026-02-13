import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useNotifications } from './useNotifications';

// Mock Firebase
vi.mock('../lib/firebase', () => ({
  getMessagingInstance: vi.fn().mockResolvedValue(null),
  isFirebaseConfigured: false,
}));

describe('useNotifications', () => {
  let originalNotification: typeof Notification | undefined;
  let originalServiceWorker: ServiceWorkerContainer | undefined;

  beforeEach(() => {
    vi.clearAllMocks();

    // Store originals
    originalNotification = window.Notification;
    originalServiceWorker = navigator.serviceWorker;

    // Set up fresh Notification mock
    const mockRequestPermission = vi.fn().mockResolvedValue('granted');
    
    Object.defineProperty(window, 'Notification', {
      writable: true,
      configurable: true,
      value: class MockNotification {
        static permission: NotificationPermission = 'default';
        static requestPermission = mockRequestPermission;
        constructor() {}
      },
    });

    // Ensure serviceWorker is available
    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      configurable: true,
      value: {
        register: vi.fn().mockResolvedValue({}),
        ready: Promise.resolve({}),
      },
    });
  });

  afterEach(() => {
    // Restore originals
    if (originalNotification) {
      Object.defineProperty(window, 'Notification', {
        writable: true,
        configurable: true,
        value: originalNotification,
      });
    }
    if (originalServiceWorker) {
      Object.defineProperty(navigator, 'serviceWorker', {
        writable: true,
        configurable: true,
        value: originalServiceWorker,
      });
    }
  });

  describe('Initial State', () => {
    it('returns initial state with permission status', async () => {
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.permission).toBe('default');
      expect(result.current.token).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('detects notification support', async () => {
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.supported).toBe(true);
    });

    it('reports unsupported when Notification API is missing', async () => {
      // Remove Notification API by setting to undefined
      Object.defineProperty(window, 'Notification', {
        writable: true,
        configurable: true,
        value: undefined,
      });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.supported).toBe(false);
    });
  });

  describe('Permission Request', () => {
    it('requests permission when requestPermission is called', async () => {
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.requestPermission();
      });

      expect(Notification.requestPermission).toHaveBeenCalled();
    });

    it('updates permission state after request', async () => {
      (Notification.requestPermission as ReturnType<typeof vi.fn>).mockResolvedValue('granted');

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.requestPermission();
      });

      expect(result.current.permission).toBe('granted');
    });

    it('handles denied permission', async () => {
      (Notification.requestPermission as ReturnType<typeof vi.fn>).mockResolvedValue('denied');

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.requestPermission();
      });

      expect(result.current.permission).toBe('denied');
      expect(result.current.error).toBe('Notification permission denied');
    });

    it('returns null when notifications not supported', async () => {
      // Remove Notification API
      Object.defineProperty(window, 'Notification', {
        writable: true,
        configurable: true,
        value: undefined,
      });

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let returnValue;
      await act(async () => {
        returnValue = await result.current.requestPermission();
      });

      expect(returnValue).toBe(null);
      expect(result.current.error).toBe('Notifications not supported');
    });
  });

  describe('Firebase Configuration', () => {
    it('exposes isFirebaseConfigured status', async () => {
      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isFirebaseConfigured).toBe(false);
    });

    it('does not attempt FCM token when Firebase is not configured', async () => {
      (Notification.requestPermission as ReturnType<typeof vi.fn>).mockResolvedValue('granted');

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.requestPermission();
      });

      // Token should still be null since Firebase isn't configured
      expect(result.current.token).toBe(null);
    });
  });
});
