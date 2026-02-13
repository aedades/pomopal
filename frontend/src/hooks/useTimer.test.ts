import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimer } from './useTimer';

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const defaultSettings = {
    work_duration_minutes: 25,
    short_break_minutes: 5,
    long_break_minutes: 15,
    long_break_interval: 4,
    auto_start_breaks: false,
    sound_enabled: true,
    notifications_enabled: true,
    dark_mode: false,
    daily_pomodoro_goal: 8,
    daily_goal_enabled: true,
    flow_mode_enabled: false,
    move_completed_to_bottom: true,
    dated_tasks_first: true,
  exclude_weekends_from_streak: false,
  };

  describe('Countdown Mode (default)', () => {
    it('initializes with focus mode and correct time', () => {
      const { result } = renderHook(() =>
        useTimer({ settings: defaultSettings, onComplete: vi.fn() })
      );

      expect(result.current.mode).toBe('work');
      expect(result.current.timeLeft).toBe(25 * 60);
      expect(result.current.isRunning).toBe(false);
      expect(result.current.sessionCount).toBe(0);
      expect(result.current.isFlowMode).toBe(false);
    });

    it('starts when toggled', () => {
      const { result } = renderHook(() =>
        useTimer({ settings: defaultSettings, onComplete: vi.fn() })
      );

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isRunning).toBe(true);
    });

    it('pauses when toggled while running', () => {
      const { result } = renderHook(() =>
        useTimer({ settings: defaultSettings, onComplete: vi.fn() })
      );

      act(() => {
        result.current.toggle(); // Start
      });

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      act(() => {
        result.current.toggle(); // Pause
      });

      expect(result.current.isRunning).toBe(false);
      const timeAfterPause = result.current.timeLeft;

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.timeLeft).toBe(timeAfterPause);
    });

    it('changes mode when setMode is called', () => {
      const { result } = renderHook(() =>
        useTimer({ settings: defaultSettings, onComplete: vi.fn() })
      );

      act(() => {
        result.current.setMode('shortBreak');
      });

      expect(result.current.mode).toBe('shortBreak');
      expect(result.current.timeLeft).toBe(5 * 60);
      expect(result.current.isRunning).toBe(false);
    });

    it('resets to correct time when resetTimer is called', () => {
      const { result } = renderHook(() =>
        useTimer({ settings: defaultSettings, onComplete: vi.fn() })
      );

      act(() => {
        result.current.toggle();
      });

      act(() => {
        vi.advanceTimersByTime(60000);
      });

      expect(result.current.timeLeft).toBeLessThan(25 * 60);

      act(() => {
        result.current.resetTimer('work');
      });

      expect(result.current.timeLeft).toBe(25 * 60);
      expect(result.current.isRunning).toBe(false);
    });

    it('uses correct duration for long break mode', () => {
      const { result } = renderHook(() =>
        useTimer({ settings: defaultSettings, onComplete: vi.fn() })
      );

      act(() => {
        result.current.setMode('longBreak');
      });

      expect(result.current.mode).toBe('longBreak');
      expect(result.current.timeLeft).toBe(15 * 60);
    });

    it('respects custom settings', () => {
      const customSettings = {
        ...defaultSettings,
        work_duration_minutes: 45,
        short_break_minutes: 10,
      };

      const { result } = renderHook(() =>
        useTimer({ settings: customSettings, onComplete: vi.fn() })
      );

      expect(result.current.timeLeft).toBe(45 * 60);

      act(() => {
        result.current.setMode('shortBreak');
      });

      expect(result.current.timeLeft).toBe(10 * 60);
    });
  });

  describe('Flow Mode', () => {
    const flowSettings = {
      ...defaultSettings,
      flow_mode_enabled: true,
    };

    it('enables flow mode when setting is true and mode is work', () => {
      const { result } = renderHook(() =>
        useTimer({ settings: flowSettings, onComplete: vi.fn() })
      );

      expect(result.current.isFlowMode).toBe(true);
    });

    it('disables flow mode for break modes even when setting is true', () => {
      const { result } = renderHook(() =>
        useTimer({ settings: flowSettings, onComplete: vi.fn() })
      );

      act(() => {
        result.current.setMode('shortBreak');
      });

      expect(result.current.isFlowMode).toBe(false);
    });

    it('counts up from 0 in flow mode', () => {
      const { result } = renderHook(() =>
        useTimer({ settings: flowSettings, onComplete: vi.fn() })
      );

      expect(result.current.elapsed).toBe(0);

      act(() => {
        result.current.toggle(); // Start
      });

      act(() => {
        vi.advanceTimersByTime(10000); // 10 seconds
      });

      expect(result.current.elapsed).toBeGreaterThanOrEqual(10);
      expect(result.current.timeLeft).toBeGreaterThanOrEqual(10); // timeLeft shows elapsed in flow mode
    });

    it('sets isOverTarget when elapsed exceeds target duration', () => {
      const shortFlowSettings = {
        ...flowSettings,
        work_duration_minutes: 1, // 1 minute target for faster test
      };

      const { result } = renderHook(() =>
        useTimer({ settings: shortFlowSettings, onComplete: vi.fn() })
      );

      expect(result.current.isOverTarget).toBe(false);

      act(() => {
        result.current.toggle();
      });

      act(() => {
        vi.advanceTimersByTime(61000); // 61 seconds
      });

      expect(result.current.isOverTarget).toBe(true);
    });

    it('completes pomodoro when stopped after reaching target', () => {
      const onComplete = vi.fn();
      const shortFlowSettings = {
        ...flowSettings,
        work_duration_minutes: 1,
      };

      const { result } = renderHook(() =>
        useTimer({ settings: shortFlowSettings, onComplete })
      );

      act(() => {
        result.current.toggle(); // Start
      });

      act(() => {
        vi.advanceTimersByTime(61000); // Over target
      });

      act(() => {
        result.current.toggle(); // Stop
      });

      expect(onComplete).toHaveBeenCalledWith('work', false);
      expect(result.current.sessionCount).toBe(1);
    });

    it('marks as interrupted when stopped before reaching target', () => {
      const onComplete = vi.fn();
      const shortFlowSettings = {
        ...flowSettings,
        work_duration_minutes: 1,
      };

      const { result } = renderHook(() =>
        useTimer({ settings: shortFlowSettings, onComplete })
      );

      act(() => {
        result.current.toggle(); // Start
      });

      act(() => {
        vi.advanceTimersByTime(30000); // 30 seconds - under target
      });

      act(() => {
        result.current.toggle(); // Stop early
      });

      expect(onComplete).toHaveBeenCalledWith('work', true);
      expect(result.current.sessionCount).toBe(0);
    });

    it('does not auto-alert when reaching target in flow mode', () => {
      const onComplete = vi.fn();
      const shortFlowSettings = {
        ...flowSettings,
        work_duration_minutes: 1,
      };

      const { result } = renderHook(() =>
        useTimer({ settings: shortFlowSettings, onComplete })
      );

      act(() => {
        result.current.toggle();
      });

      act(() => {
        vi.advanceTimersByTime(120000); // 2 minutes - well over target
      });

      // Should still be running, no auto-complete
      expect(result.current.isRunning).toBe(true);
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('provides targetTime for UI display', () => {
      const { result } = renderHook(() =>
        useTimer({ settings: flowSettings, onComplete: vi.fn() })
      );

      expect(result.current.targetTime).toBe(25 * 60);
    });
  });

  describe('Background Timer (Visibility Change)', () => {
    it('calculates correct time when returning from background', () => {
      const { result } = renderHook(() =>
        useTimer({ settings: defaultSettings, onComplete: vi.fn() })
      );

      act(() => {
        result.current.toggle(); // Start at 25:00
      });

      // Simulate going to background for 5 minutes
      act(() => {
        vi.advanceTimersByTime(5 * 60 * 1000);
      });

      // Timer should show ~20:00
      expect(result.current.timeLeft).toBeLessThanOrEqual(20 * 60);
      expect(result.current.timeLeft).toBeGreaterThanOrEqual(19 * 60);
    });

    it('completes timer if time elapsed while in background', () => {
      const onComplete = vi.fn();
      const shortSettings = {
        ...defaultSettings,
        work_duration_minutes: 1,
      };

      const { result } = renderHook(() =>
        useTimer({ settings: shortSettings, onComplete })
      );

      act(() => {
        result.current.toggle();
      });

      // Simulate being in background for longer than timer
      act(() => {
        vi.advanceTimersByTime(2 * 60 * 1000);
      });

      expect(onComplete).toHaveBeenCalled();
      expect(result.current.isRunning).toBe(false);
    });

    it('pauses correctly and resumes from paused time', () => {
      const { result } = renderHook(() =>
        useTimer({ settings: defaultSettings, onComplete: vi.fn() })
      );

      act(() => {
        result.current.toggle(); // Start
      });

      act(() => {
        vi.advanceTimersByTime(60000); // 1 minute
      });

      act(() => {
        result.current.toggle(); // Pause
      });

      const pausedTime = result.current.timeLeft;

      // Time passes while paused
      act(() => {
        vi.advanceTimersByTime(60000);
      });

      // Time should not have changed
      expect(result.current.timeLeft).toBe(pausedTime);

      // Resume
      act(() => {
        result.current.toggle();
      });

      act(() => {
        vi.advanceTimersByTime(30000); // 30 more seconds
      });

      // Should be ~30 seconds less than paused time
      expect(result.current.timeLeft).toBeLessThan(pausedTime);
    });
  });

  describe('Session Management', () => {
    it('increments session count after completing work session', () => {
      const onComplete = vi.fn();
      const shortSettings = {
        ...defaultSettings,
        work_duration_minutes: 1,
      };

      const { result } = renderHook(() =>
        useTimer({ settings: shortSettings, onComplete })
      );

      expect(result.current.sessionCount).toBe(0);

      act(() => {
        result.current.toggle();
      });

      act(() => {
        vi.advanceTimersByTime(61000);
      });

      expect(result.current.sessionCount).toBe(1);
    });

    it('switches to long break after completing long_break_interval sessions', () => {
      const onComplete = vi.fn();
      const shortSettings = {
        ...defaultSettings,
        work_duration_minutes: 1,
        short_break_minutes: 1,
        long_break_interval: 2,
      };

      const { result } = renderHook(() =>
        useTimer({ settings: shortSettings, onComplete })
      );

      // Complete first work session
      act(() => {
        result.current.toggle();
      });
      act(() => {
        vi.advanceTimersByTime(61000);
      });

      expect(result.current.mode).toBe('shortBreak');

      // Go back to work mode and complete second session
      act(() => {
        result.current.setMode('work');
      });
      act(() => {
        result.current.toggle();
      });
      act(() => {
        vi.advanceTimersByTime(61000);
      });

      expect(result.current.mode).toBe('longBreak');
    });
  });
});
