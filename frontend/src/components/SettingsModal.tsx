import { useState } from 'react'
import type { Settings } from '../hooks/useSettings'

interface SettingsModalProps {
  settings: Settings
  onUpdate: (updates: Partial<Settings>) => void
  onClose: () => void
}

// Number input that allows empty while typing, validates on blur
function NumberInput({ id, value, onChange, defaultValue, min = 1, max = 99, className }: { 
  id?: string
  value: number
  onChange: (n: number) => void
  defaultValue: number
  min?: number
  max?: number
  className?: string
}) {
  const [localValue, setLocalValue] = useState(String(value))
  
  const handleBlur = () => {
    const num = parseInt(localValue)
    if (isNaN(num) || num < min) {
      setLocalValue(String(defaultValue))
      onChange(defaultValue)
    } else if (num > max) {
      setLocalValue(String(max))
      onChange(max)
    } else {
      onChange(num)
    }
  }
  
  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      className={className || "w-20 px-3 py-2 rounded-lg text-center transition-colors"}
      style={{
        background: 'var(--color-bg-tertiary)',
        color: 'var(--color-text-primary)',
        border: 'none',
      }}
    />
  )
}

// Help tooltip component
function HelpTip({ text }: { text: string }) {
  const [show, setShow] = useState(false)
  
  return (
    <span className="relative inline-block ml-1">
      <button
        type="button"
        onClick={() => setShow(!show)}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="w-4 h-4 rounded-full text-xs inline-flex items-center justify-center transition-colors"
        style={{
          background: 'var(--color-bg-tertiary)',
          color: 'var(--color-text-secondary)',
        }}
        aria-label="Help"
      >
        ?
      </button>
      {show && (
        <div 
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 max-w-56 w-max p-2.5 text-xs rounded-xl shadow-lg z-10 whitespace-normal"
          style={{
            background: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {text}
        </div>
      )}
    </span>
  )
}

export default function SettingsModal({ settings, onUpdate, onClose }: SettingsModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div 
        className="glass-elevated rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in-up"
        style={{ background: 'var(--color-bg-primary)' }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Settings
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--color-bg-tertiary)]"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Timer Durations */}
          <section>
            <h3 
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Timer
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label 
                  htmlFor="work-duration" 
                  className="text-sm mb-1 block"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Work
                </label>
                <NumberInput
                  id="work-duration"
                  value={settings.work_duration_minutes}
                  onChange={(n) => onUpdate({ work_duration_minutes: n })}
                  defaultValue={25}
                  min={1}
                  max={60}
                  className="w-full mt-1 px-3 py-2.5 rounded-lg text-center transition-colors"
                />
              </div>
              <div>
                <label 
                  htmlFor="short-break-duration" 
                  className="text-sm mb-1 block"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Short Break
                </label>
                <NumberInput
                  id="short-break-duration"
                  value={settings.short_break_minutes}
                  onChange={(n) => onUpdate({ short_break_minutes: n })}
                  defaultValue={5}
                  min={1}
                  max={30}
                  className="w-full mt-1 px-3 py-2.5 rounded-lg text-center transition-colors"
                />
              </div>
              <div>
                <label 
                  htmlFor="long-break-duration" 
                  className="text-sm mb-1 block"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Long Break
                </label>
                <NumberInput
                  id="long-break-duration"
                  value={settings.long_break_minutes}
                  onChange={(n) => onUpdate({ long_break_minutes: n })}
                  defaultValue={15}
                  min={1}
                  max={60}
                  className="w-full mt-1 px-3 py-2.5 rounded-lg text-center transition-colors"
                />
              </div>
            </div>
          </section>

          {/* Goals */}
          <section>
            <h3 
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Goals
            </h3>
            <div className="space-y-3">
              <Toggle
                label="Daily pomodoro goal"
                checked={settings.daily_goal_enabled}
                onChange={(v) => onUpdate({ daily_goal_enabled: v })}
              />
              {settings.daily_goal_enabled && (
                <div className="flex items-center justify-between pl-4">
                  <label 
                    htmlFor="daily-goal" 
                    className="text-sm"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Target
                  </label>
                  <NumberInput
                    id="daily-goal"
                    value={settings.daily_pomodoro_goal}
                    onChange={(n) => onUpdate({ daily_pomodoro_goal: n })}
                    defaultValue={8}
                  />
                </div>
              )}
              <Toggle
                label="Exclude weekends from streak"
                checked={settings.exclude_weekends_from_streak}
                onChange={(v) => onUpdate({ exclude_weekends_from_streak: v })}
              />
            </div>
          </section>

          {/* Behavior */}
          <section>
            <h3 
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Behavior
            </h3>
            <div className="space-y-3">
              <Toggle
                label="Auto-start breaks"
                checked={settings.auto_start_breaks}
                onChange={(v) => onUpdate({ auto_start_breaks: v })}
              />
              <Toggle
                label="Sound notifications"
                checked={settings.sound_enabled}
                onChange={(v) => onUpdate({ sound_enabled: v })}
              />
              <Toggle
                label="Browser notifications"
                checked={settings.notifications_enabled}
                onChange={(v) => onUpdate({ notifications_enabled: v })}
                help="Works even when tab is in background."
              />
              <Toggle
                label="Dark mode"
                checked={settings.dark_mode}
                onChange={(v) => onUpdate({ dark_mode: v })}
              />
              <Toggle
                label="Move completed tasks to bottom"
                checked={settings.move_completed_to_bottom}
                onChange={(v) => onUpdate({ move_completed_to_bottom: v })}
              />
              <Toggle
                label="Show dated tasks first"
                checked={settings.dated_tasks_first}
                onChange={(v) => onUpdate({ dated_tasks_first: v })}
              />
            </div>
          </section>

          {/* Flow Mode */}
          <section>
            <h3 
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Flow Mode
            </h3>
            <div className="space-y-3">
              <Toggle
                label="Enable flow mode"
                checked={settings.flow_mode_enabled}
                onChange={(v) => onUpdate({ flow_mode_enabled: v })}
                help="Timer counts up with no alerts. Stop anytime after target to complete."
              />
              <p 
                className="text-sm leading-relaxed"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Timer counts up from 0. No alerts — work uninterrupted. 
                Stop anytime after {settings.work_duration_minutes} min to complete a pomodoro.
              </p>
            </div>
          </section>

          {/* Long break interval */}
          <section>
            <div className="flex items-center justify-between">
              <label style={{ color: 'var(--color-text-primary)' }}>
                Long break after
              </label>
              <div className="flex items-center gap-2">
                <NumberInput
                  value={settings.long_break_interval}
                  onChange={(n) => onUpdate({ long_break_interval: n })}
                  defaultValue={4}
                  min={2}
                  max={10}
                  className="w-16 px-3 py-2 rounded-lg text-center transition-colors"
                />
                <span style={{ color: 'var(--color-text-secondary)' }}>pomodoros</span>
              </div>
            </div>
          </section>
        </div>

        <button
          onClick={onClose}
          className="btn-primary w-full mt-6"
        >
          Done
        </button>
      </div>
    </div>
  )
}

function Toggle({
  label,
  checked,
  onChange,
  help,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
  help?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: 'var(--color-text-primary)' }}>
        {label}
        {help && <HelpTip text={help} />}
      </span>
      <button
        onClick={() => onChange(!checked)}
        className="w-12 h-7 rounded-full transition-all duration-200"
        style={{
          background: checked ? 'var(--color-accent)' : 'var(--color-bg-tertiary)',
        }}
      >
        <div
          className="w-5 h-5 rounded-full shadow transition-transform duration-200"
          style={{
            background: 'white',
            transform: checked ? 'translateX(26px)' : 'translateX(2px)',
          }}
        />
      </button>
    </div>
  )
}
