import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DailyProgress from './DailyProgress';

describe('DailyProgress', () => {
  it('shows progress toward daily goal', () => {
    render(<DailyProgress current={3} goal={8} />);
    expect(screen.getByText(/Today's Progress/i)).toBeInTheDocument();
    // Component shows "3 / 8 🍅"
    expect(screen.getByText(/3/)).toBeInTheDocument();
    expect(screen.getByText(/8/)).toBeInTheDocument();
  });

  it('shows completion message when goal is reached', () => {
    render(<DailyProgress current={8} goal={8} />);
    expect(screen.getByText(/Daily goal reached/i)).toBeInTheDocument();
  });
});
