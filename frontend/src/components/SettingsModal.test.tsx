import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SettingsModal from './SettingsModal';

describe('SettingsModal', () => {
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
    flow_mode_enabled: false,
    move_completed_to_bottom: true,
  };

  const mockOnUpdate = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays current settings values', () => {
    const customSettings = {
      ...defaultSettings,
      work_duration_minutes: 45,
      daily_pomodoro_goal: 12,
    };

    render(
      <SettingsModal
        settings={customSettings}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByLabelText(/work/i)).toHaveValue(45);
    expect(screen.getByLabelText(/daily pomodoro goal/i)).toHaveValue(12);
  });

  it('calls onUpdate with new value when timer duration changes', () => {
    render(
      <SettingsModal
        settings={defaultSettings}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    fireEvent.change(screen.getByLabelText(/work/i), { target: { value: '30' } });
    expect(mockOnUpdate).toHaveBeenCalledWith({ work_duration_minutes: 30 });

    fireEvent.change(screen.getByLabelText(/short break/i), { target: { value: '10' } });
    expect(mockOnUpdate).toHaveBeenCalledWith({ short_break_minutes: 10 });
  });

  it('calls onUpdate when toggles are clicked', () => {
    render(
      <SettingsModal
        settings={defaultSettings}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    const flowModeToggle = screen.getByText(/enable flow mode/i).closest('div')?.querySelector('button');
    fireEvent.click(flowModeToggle!);
    expect(mockOnUpdate).toHaveBeenCalledWith({ flow_mode_enabled: true });
  });

  it('calls onClose when Done button is clicked', () => {
    render(
      <SettingsModal
        settings={defaultSettings}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Done'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when X button is clicked', () => {
    render(
      <SettingsModal
        settings={defaultSettings}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('✕'));
    expect(mockOnClose).toHaveBeenCalled();
  });
});
