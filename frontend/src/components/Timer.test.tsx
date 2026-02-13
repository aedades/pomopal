import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Timer from './Timer';

describe('Timer', () => {
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
    show_completed_projects: false,
  };

  const defaultProps = {
    mode: 'work' as const,
    timeLeft: 1500, // 25 minutes
    isRunning: false,
    sessionCount: 0,
    activeTask: null,
    onToggle: vi.fn(),
    onReset: vi.fn(),
    onModeChange: vi.fn(),
    settings: defaultSettings,
  };

  it('formats time correctly (MM:SS)', () => {
    render(<Timer {...defaultProps} timeLeft={65} />);
    expect(screen.getByText('01:05')).toBeInTheDocument();
  });

  it('shows Start when paused, Pause when running', () => {
    const { rerender } = render(<Timer {...defaultProps} isRunning={false} />);
    expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();

    rerender(<Timer {...defaultProps} isRunning={true} />);
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
  });

  it('calls onToggle when start/pause clicked', () => {
    const onToggle = vi.fn();
    render(<Timer {...defaultProps} onToggle={onToggle} />);

    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('calls onReset when reset clicked', () => {
    const onReset = vi.fn();
    render(<Timer {...defaultProps} onReset={onReset} />);

    fireEvent.click(screen.getByRole('button', { name: /reset/i }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('calls onModeChange when mode tab clicked', () => {
    const onModeChange = vi.fn();
    render(<Timer {...defaultProps} onModeChange={onModeChange} />);

    fireEvent.click(screen.getByRole('button', { name: /short break/i }));
    expect(onModeChange).toHaveBeenCalledWith('shortBreak');
  });

  it('displays active task name when provided', () => {
    render(<Timer {...defaultProps} activeTask="Write documentation" />);
    expect(screen.getByText('Write documentation')).toBeInTheDocument();
  });
});
