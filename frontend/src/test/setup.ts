import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  writable: true,
  configurable: true,
  value: class MockNotification {
    static permission: NotificationPermission = 'default';
    static requestPermission = vi.fn().mockResolvedValue('granted');
    constructor() {}
  },
});

// Mock ServiceWorker (needed for notification support check)
Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  configurable: true,
  value: {
    register: vi.fn().mockResolvedValue({}),
    ready: Promise.resolve({}),
  },
});

// Mock Audio
Object.defineProperty(window, 'Audio', {
  writable: true,
  value: class MockAudio {
    play = vi.fn().mockResolvedValue(undefined);
    pause = vi.fn();
    src = '';
  },
});

// Mock vibration API
Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: vi.fn(),
});
