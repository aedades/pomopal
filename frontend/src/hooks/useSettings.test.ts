import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSettings } from './useSettings';

describe('useSettings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const DEFAULT_SETTINGS = {
    daily_pomodoro_goal: 8,
    flow_mode_enabled: false,
    auto_start_breaks: false,
    dark_mode: false,
    sound_enabled: true,
    notifications_enabled: true,
    work_duration_minutes: 25,
    short_break_minutes: 5,
    long_break_minutes: 15,
    long_break_interval: 4,
    move_completed_to_bottom: true,
  };

  it('returns default settings when localStorage is empty', () => {
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
  });

  it('loads settings from localStorage', () => {
    const customSettings = {
      ...DEFAULT_SETTINGS,
      work_duration_minutes: 30,
      dark_mode: true,
    };

    localStorage.setItem('pomodoro:settings', JSON.stringify(customSettings));

    const { result } = renderHook(() => useSettings());
    expect(result.current.settings.work_duration_minutes).toBe(30);
    expect(result.current.settings.dark_mode).toBe(true);
  });

  it('updates individual settings', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.updateSettings({ work_duration_minutes: 45 });
    });

    expect(result.current.settings.work_duration_minutes).toBe(45);
    // Other settings should remain unchanged
    expect(result.current.settings.short_break_minutes).toBe(5);
  });

  it('persists settings to localStorage', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.updateSettings({ work_duration_minutes: 50 });
    });

    const stored = JSON.parse(localStorage.getItem('pomodoro:settings')!);
    expect(stored.work_duration_minutes).toBe(50);
  });

  it('updates multiple settings at once', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.updateSettings({
        work_duration_minutes: 30,
        short_break_minutes: 10,
        dark_mode: true,
      });
    });

    expect(result.current.settings.work_duration_minutes).toBe(30);
    expect(result.current.settings.short_break_minutes).toBe(10);
    expect(result.current.settings.dark_mode).toBe(true);
  });

  it('merges partial updates with existing settings', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.updateSettings({ dark_mode: true });
    });

    // All other defaults should still be there
    expect(result.current.settings.work_duration_minutes).toBe(25);
    expect(result.current.settings.dark_mode).toBe(true);
  });
});
