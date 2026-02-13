import { useState } from 'react'
import type { Settings } from '../hooks/useSettings'

interface SettingsModalProps {
  settings: Settings
  onUpdate: (updates: Partial<Settings>) => void
  onClose: () => void
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
        className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-xs inline-flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500"
        aria-label="Help"
      >
        ?
      </button>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 text-xs text-white bg-gray-800 dark:bg-gray-900 rounded-lg shadow-lg z-10">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800 dark:border-t-gray-900" />
        </div>
      )}
    </span>
  )
}

export default function SettingsModal({ settings, onUpdate, onClose }: SettingsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Timer Durations */}
          <section>
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase mb-3">
              Timer
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="work-duration" className="text-sm text-gray-600 dark:text-gray-400">Work</label>
                <input
                  id="work-duration"
                  type="number"
                  value={settings.work_duration_minutes}
                  onChange={(e) => onUpdate({ work_duration_minutes: parseInt(e.target.value) || 25 })}
                  className="w-full mt-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min="1"
                  max="60"
                />
              </div>
              <div>
                <label htmlFor="short-break-duration" className="text-sm text-gray-600 dark:text-gray-400">Short Break</label>
                <input
                  id="short-break-duration"
                  type="number"
                  value={settings.short_break_minutes}
                  onChange={(e) => onUpdate({ short_break_minutes: parseInt(e.target.value) || 5 })}
                  className="w-full mt-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min="1"
                  max="30"
                />
              </div>
              <div>
                <label htmlFor="long-break-duration" className="text-sm text-gray-600 dark:text-gray-400">Long Break</label>
                <input
                  id="long-break-duration"
                  type="number"
                  value={settings.long_break_minutes}
                  onChange={(e) => onUpdate({ long_break_minutes: parseInt(e.target.value) || 15 })}
                  className="w-full mt-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min="1"
                  max="60"
                />
              </div>
            </div>
          </section>

          {/* Goals */}
          <section>
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase mb-3">
              Goals
            </h3>
            <div className="flex items-center justify-between">
              <label htmlFor="daily-goal" className="text-gray-700 dark:text-gray-300">
                Daily pomodoro goal
                <HelpTip text="Set a target number of pomodoros to complete each day. Your progress is shown at the top of the timer view." />
              </label>
              <input
                id="daily-goal"
                type="number"
                value={settings.daily_pomodoro_goal}
                onChange={(e) => onUpdate({ daily_pomodoro_goal: parseInt(e.target.value) || 8 })}
                className="w-20 px-3 py-2 border rounded-lg text-center dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                min="1"
                max="20"
              />
            </div>
          </section>

          {/* Behavior */}
          <section>
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase mb-3">
              Behavior
            </h3>
            <div className="space-y-3">
              <Toggle
                label="Auto-start breaks"
                checked={settings.auto_start_breaks}
                onChange={(v) => onUpdate({ auto_start_breaks: v })}
                help="Automatically start break timer when a work session ends."
              />
              <Toggle
                label="Sound notifications"
                checked={settings.sound_enabled}
                onChange={(v) => onUpdate({ sound_enabled: v })}
                help="Play a sound when the timer completes."
              />
              <Toggle
                label="Browser notifications"
                checked={settings.notifications_enabled}
                onChange={(v) => onUpdate({ notifications_enabled: v })}
                help="Show a desktop notification when the timer completes (even if the tab is in the background)."
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
                help="Automatically sort completed tasks to the bottom of the list."
              />
            </div>
          </section>

          {/* Flow Mode */}
          <section>
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase mb-3">
              Flow Mode ⏱
            </h3>
            <div className="space-y-3">
              <Toggle
                label="Enable flow mode"
                checked={settings.flow_mode_enabled}
                onChange={(v) => onUpdate({ flow_mode_enabled: v })}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Timer counts up from 0. No alerts — work uninterrupted. 
                Stop anytime after {settings.work_duration_minutes} min to complete a pomodoro.
              </p>
            </div>
          </section>

          {/* Long break interval */}
          <section>
            <div className="flex items-center justify-between">
              <label className="text-gray-700 dark:text-gray-300">
                Long break after
                <HelpTip text="After completing this many pomodoros, you'll get a longer break instead of a short one." />
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={settings.long_break_interval}
                  onChange={(e) => onUpdate({ long_break_interval: parseInt(e.target.value) || 4 })}
                  className="w-16 px-3 py-2 border rounded-lg text-center dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min="2"
                  max="10"
                />
                <span className="text-gray-600 dark:text-gray-400">pomodoros</span>
              </div>
            </div>
          </section>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
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
      <span className="text-gray-700 dark:text-gray-300">
        {label}
        {help && <HelpTip text={help} />}
      </span>
      <button
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <div
          className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )
}
