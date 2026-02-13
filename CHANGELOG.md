# Changelog

All notable changes to this project will be documented in this file.

## [0.9.0] - 2026-02-12

### Added
- **Keyboard shortcuts** — Space (start/pause), S (skip), N (new task)
- **Productivity insights** — Most productive day of week and hour of day analysis
- SEO meta tags (description, Open Graph, Twitter cards)
- `robots.txt` and `sitemap.xml` for search engine indexing
- Improved page title: "Pomodoro Timer - Focus & Task Management"

### Changed
- Enhanced manifest.json with SEO-friendly description
- Stats view now shows productivity insights with day-of-week chart

## [0.8.0] - 2026-02-12

### Added
- **Firestore integration scaffold** — Ready for Firebase backend
- `useFirestoreData` hook — mirrors `useGuestData` interface for seamless switching
- `migrateLocalToFirestore()` — migrates localStorage data on first sign-in
- TaskContext now auto-switches between guest/cloud based on auth state
- `isCloudSync` and `isLoading` flags exposed from TaskContext

### Technical
- When Firebase is configured:
  1. Uncomment Firebase imports in `useFirestoreData.ts`
  2. Enable Firestore offline persistence
  3. Users' local data auto-migrates on first sign-in
  4. Real-time sync across devices via Firestore listeners

### Architecture
```
Guest mode → useGuestData (localStorage)
Signed in  → useFirestoreData (Firestore + offline cache)
First sign-in → migrate localStorage → Firestore → clear local
```

## [0.7.1] - 2026-02-12

### Changed
- Updated Buy Me a Coffee link to [buymeacoffee.com/aedades](https://buymeacoffee.com/aedades)

## [0.7.0] - 2026-02-12

### Added
- **"Buy me a coffee" button** in footer for tips/donations
- Yellow pill-style button links to Buy Me a Coffee

## [0.6.0] - 2026-02-12

### Added
- **Google Sign-In button** (stubbed) — UI ready for Firebase Auth integration
- **AuthContext** — Scaffolding for user authentication state
- Sign-in button in header with Google logo

### Technical
- AuthProvider wraps app for future auth state management
- When Firebase is configured: enables multi-device sync via Firestore

## [0.5.0] - 2026-02-12

### Added
- **"No Project" filter** — Dropdown now has: All Tasks, No Project, and each project
- Filter for tasks without any project assigned

### Changed
- Renamed "All Projects" to "All Tasks" for clarity

## [0.4.1] - 2026-02-12

### Fixed
- **Task title disappearing on complete** — Partial updates were overwriting fields with `undefined`
- **Cannot remove project from task** — Clearing project (setting to `undefined`) now works correctly

### Changed
- Consolidated two project dropdowns into one (filters view + assigns new tasks)
- Input placeholder shows selected project: "Add task to Work..."

### Technical
- `updateTask` now uses `'key' in updates` to distinguish "not provided" vs "explicitly undefined"
- Added regression tests for both bugs
- Tests: 118 passing

## [0.4.0] - 2026-02-12

### Added
- **Task Editing** — Click ✏️ to edit task name, project, and estimated pomodoros
- **Project Management Modal** — "⚙️ Projects" button opens dedicated management UI
- **Delete Confirmation** — Projects require confirmation before deletion
- **Cascade Delete** — Deleting a project also deletes all associated tasks
- **Move Completed to Bottom** — New setting (on by default) auto-sorts completed tasks

### Changed
- Removed project chips from task list (cleaner UI)
- Separated filter dropdown (top) from new task project assignment (below input)
- Added fallback text for tasks with empty titles

### Fixed
- Completed task text no longer disappears

### Technical
- Added `deleteProjectWithTasks` to TaskContext
- Added PR-CHECKLIST.md for development workflow
- Tests: 116 passing (cleaned up slop tests, removed config.test.ts)

## [0.3.0] - 2026-02-12

### Added
- **Flow Mode** — Timer counts up from 0, no alerts, work uninterrupted until you stop
  - Enable in Settings → "Flow Mode"
  - Ring turns green when you hit target time
  - Complete pomodoro anytime after reaching target
- **Background Timer Fix** — Timer now uses end-time calculation, works correctly when app is backgrounded
- **Comprehensive Test Suite** — Added tests for:
  - Flow mode timer behavior (count up, isOverTarget, completion logic)
  - Background timer (visibility change handling)
  - Settings modal UI interactions
  - Notification hooks (permission, Firebase status)
- **Accessibility** — Added proper label associations for form inputs

### Changed
- Timer now stores `endTime` instead of counting down, survives browser backgrounding
- Settings modal inputs now have proper `htmlFor`/`id` associations

### Technical
- TDD workflow adopted for all future changes
- Tests: 100+ test cases covering core functionality
- PR-style development pattern for local changes

## [0.2.0] - 2026-02-12

### Added
- **PWA Support** — Install on home screen for app-like experience
- **iOS Detection** — Auto-detect iPhone/iPad and show setup instructions
- **Push Notification Infrastructure** — Firebase Cloud Functions for background notifications
- **Firebase Integration** — Auth, Firestore, Cloud Messaging setup
- **Multi-device Sync** — Sign in with Google to sync across devices
- **Device Detection Utilities** — `isIOS()`, `isPWA()`, `supportsWebPush()`, etc.
- **iOS Install Banner** — Prompts users to add to home screen
- **Notification Permission Flow** — Guided setup for iOS 16.4+

### Changed
- Simplified deployment to GitHub Pages (removed GCP/Cloud Run)
- Firebase SDK integration with graceful guest mode fallback
- Restructured project for frontend-first development

### Technical
- Added Vitest + React Testing Library
- Added Firebase SDK (lazy initialization)
- Added service worker for push notifications
- Added PWA manifest

## [0.1.0] - 2026-02-12

### Added
- Initial release
- Pomodoro timer with configurable durations
- Work/Short Break/Long Break modes
- Task management with projects
- Estimated vs actual pomodoro tracking
- Daily goal with progress visualization
- Dark mode
- Keyboard shortcuts (Space to start/pause)
- Sound and vibration alerts
- Guest mode with localStorage persistence
- Mobile-friendly responsive design
- Safari iOS compatibility fixes
