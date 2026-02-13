interface HelpModalProps {
  onClose: () => void
}

export default function HelpModal({ onClose }: HelpModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            🍅 How to Use
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6 text-gray-700 dark:text-gray-300">
          {/* What is Pomodoro */}
          <section>
            <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
              What is the Pomodoro Technique?
            </h3>
            <p className="text-sm leading-relaxed">
              The Pomodoro Technique is a time management method that uses focused 
              work sessions (typically 25 minutes) followed by short breaks. After 
              4 sessions, you take a longer break. It helps you maintain focus and 
              avoid burnout.
            </p>
          </section>

          {/* Quick Start */}
          <section>
            <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
              Quick Start
            </h3>
            <ol className="text-sm space-y-2 list-decimal list-inside">
              <li>
                <strong>Add a task</strong> — Type what you want to work on and press Enter
              </li>
              <li>
                <strong>Select it</strong> — Click the task to make it active
              </li>
              <li>
                <strong>Start the timer</strong> — Press the Start button or hit <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Space</kbd>
              </li>
              <li>
                <strong>Focus</strong> — Work until the timer ends (25 min by default)
              </li>
              <li>
                <strong>Take a break</strong> — Rest for 5 minutes, then repeat
              </li>
              <li>
                <strong>Long break</strong> — After 4 pomodoros, take a 15-30 minute break
              </li>
            </ol>
          </section>

          {/* Keyboard Shortcuts */}
          <section>
            <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
              Keyboard Shortcuts
            </h3>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Start / Pause timer</span>
                <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Space</kbd>
              </div>
              <div className="flex justify-between">
                <span>Skip / Reset current session</span>
                <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">S</kbd>
              </div>
              <div className="flex justify-between">
                <span>New task (focus input)</span>
                <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">N</kbd>
              </div>
            </div>
          </section>

          {/* Tips */}
          <section>
            <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
              Tips for Success
            </h3>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Break large tasks into smaller, actionable items</li>
              <li>Estimate how many pomodoros each task will take</li>
              <li>Avoid distractions during focus time — they can wait!</li>
              <li>Actually rest during breaks — stretch, hydrate, look away</li>
              <li>Review your stats to find your most productive times</li>
            </ul>
          </section>

          {/* Learn More */}
          <section className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <a
              href="https://en.wikipedia.org/wiki/Pomodoro_Technique"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
            >
              📚 Learn more about the Pomodoro Technique
              <span className="text-xs">↗</span>
            </a>
          </section>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
        >
          Got it!
        </button>
      </div>
    </div>
  )
}
