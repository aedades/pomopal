# Changelog

All notable changes to this project will be documented in this file.

## [1.1.5](https://github.com/aedades/pomopal/compare/v1.1.4...v1.1.5) (2026-02-13)


### Bug Fixes

* run merge on every sign-in, not just first time ever ([#27](https://github.com/aedades/pomopal/issues/27)) ([e068c9f](https://github.com/aedades/pomopal/commit/e068c9ff1fcd5428c50c6dbce9108c5331feb774))

## [1.1.4](https://github.com/aedades/pomopal/compare/v1.1.3...v1.1.4) (2026-02-13)


### Bug Fixes

* use correct localStorage keys for guest data sync ([#25](https://github.com/aedades/pomopal/issues/25)) ([edae0db](https://github.com/aedades/pomopal/commit/edae0db1a4d3a10202321ec716c77fae3172b239))

## [1.1.3](https://github.com/aedades/pomopal/compare/v1.1.2...v1.1.3) (2026-02-13)


### Bug Fixes

* reset migration state on sign-out ([#23](https://github.com/aedades/pomopal/issues/23)) ([8fe36eb](https://github.com/aedades/pomopal/commit/8fe36eb8dc26894f32303b4df90985169f38ab20))

## [1.1.2](https://github.com/aedades/pomopal/compare/v1.1.1...v1.1.2) (2026-02-13)


### Bug Fixes

* remove redundant help text from obvious settings ([#22](https://github.com/aedades/pomopal/issues/22)) ([315d9f7](https://github.com/aedades/pomopal/commit/315d9f7a97469bb029416000ce7485706d220938))
* save Firestore data to localStorage on sign-out ([#20](https://github.com/aedades/pomopal/issues/20)) ([88b4893](https://github.com/aedades/pomopal/commit/88b48933a62ce07fdcaa41ce56cdf8ec21321043))

## [1.1.1](https://github.com/aedades/pomopal/compare/v1.1.0...v1.1.1) (2026-02-13)


### Bug Fixes

* read version from root package.json where release-please updates it ([#18](https://github.com/aedades/pomopal/issues/18)) ([59c344a](https://github.com/aedades/pomopal/commit/59c344aac7e0a51ed3a7e0a89d1931694a84cdfe))

## [1.1.0](https://github.com/aedades/pomopal/compare/v1.0.1...v1.1.0) (2026-02-13)


### Features

* sync timer state across devices ([6fe33fd](https://github.com/aedades/pomopal/commit/6fe33fd26f58b7b4397662dc81bd50bb69a3c1f6))
* sync timer state across devices via Firestore ([f079fd2](https://github.com/aedades/pomopal/commit/f079fd252c6b462d558567be18be28629457d4d6))
* wire up push notifications to timer ([9a36013](https://github.com/aedades/pomopal/commit/9a36013cf48820256f7b1b2ef89ef5a8e1494d26))
* wire up push notifications to timer ([cb37784](https://github.com/aedades/pomopal/commit/cb3778439d2bf5de714782f3b5536b3c2911548e))


### Bug Fixes

* filter undefined values before Firestore writes ([257e907](https://github.com/aedades/pomopal/commit/257e907894d541db3004a993ec5715378ffef19b))
* filter undefined values before Firestore writes ([e86dde1](https://github.com/aedades/pomopal/commit/e86dde1883d4ce883ecaabcd0539f742dd7838c2))

## [1.0.1](https://github.com/aedades/pomopal/compare/v1.0.0...v1.0.1) (2026-02-13)


### Bug Fixes

* add Firebase config for production builds ([a89c920](https://github.com/aedades/pomopal/commit/a89c920c08a21eb7105544c0a2af20afb3a2dc81))
* add Firebase config for production builds ([870ccaa](https://github.com/aedades/pomopal/commit/870ccaa238f0ee2bf695ff694266a2067c197821))

## 1.0.0 (2026-02-13)


### Features

* add help tips to all settings + tests for core behavior ([c881a39](https://github.com/aedades/pomopal/commit/c881a396916579d6a314d197b70d72dd7c25564a))
* add release-please for versioning and deployments ([efa36b5](https://github.com/aedades/pomopal/commit/efa36b579038426a912df9d4bdc9ae7d775f6c10))
* add release-please for versioning and deployments ([404d420](https://github.com/aedades/pomopal/commit/404d42046fb5a30940d0573d126f7f432d31fbd0))
* add seed data for local testing ([a427954](https://github.com/aedades/pomopal/commit/a427954973738efa91144c3f374febafe99d3fc3))
* add seed data for local testing ([53965c5](https://github.com/aedades/pomopal/commit/53965c56f40d263f113c21bad91908418256611f))
* add stats/metrics view ([5f0dcae](https://github.com/aedades/pomopal/commit/5f0dcae6cf32fcb00a8d8daf4597a1edfec47526))
* add Timezone Buddy link to footer ([ba41509](https://github.com/aedades/pomopal/commit/ba4150939f3529190b0ae01b2e16a48439e257f7))
* add Timezone Buddy link to footer ([5eb2027](https://github.com/aedades/pomopal/commit/5eb202785740c99c157457f38294c5b59df360d7))
* drag-drop reordering for undated tasks ([00426b1](https://github.com/aedades/pomopal/commit/00426b14bc061bc2d7dc03a07b2e8aee5a799555))
* Google Sign-In with Firestore cloud sync ([d277f90](https://github.com/aedades/pomopal/commit/d277f908f7a76a92ab6ca42d0f2eec65b5f10f38))
* Google Sign-In with Firestore cloud sync ([ff6e998](https://github.com/aedades/pomopal/commit/ff6e99826c52957ed45612b5905bd2ea8bf9bd7c))
* help modal and settings tooltips ([dc53aaf](https://github.com/aedades/pomopal/commit/dc53aafd87c53dbedc28286beb6efdf0019ba698))
* keyboard shortcuts, productivity insights, SEO meta tags ([b96c93e](https://github.com/aedades/pomopal/commit/b96c93e38f3b5e55e9b93fed6a3835d4dbfca1e3))
* make time optional for due dates ([7188aae](https://github.com/aedades/pomopal/commit/7188aae15bb48adf052c43c5391719816b38271f))
* optional daily goal with toggle ([7d8deea](https://github.com/aedades/pomopal/commit/7d8deeab757fe1fe15de8d1305223c45f57e3411))
* optional due dates for tasks with auto-sorting ([0c8548d](https://github.com/aedades/pomopal/commit/0c8548dcf1d6f2fdd207e0623b024f0786e5bdd6))
* preset Spotify playlists for focus music ([dc1f045](https://github.com/aedades/pomopal/commit/dc1f045d55ecc749b46e0c863aff309788dcdb46))
* project due dates and edit modal ([67f6892](https://github.com/aedades/pomopal/commit/67f68929eba19fbd3dbfd1d18e6e6c908d3ec9cd))
* rebrand to pomo pal 🍅 ([ae08b93](https://github.com/aedades/pomopal/commit/ae08b93bb947dbde9818660c3c114daa8751e64d))
* rebrand to pomo pal 🍅 ([ec04b51](https://github.com/aedades/pomopal/commit/ec04b51c270ef799e2487ff59d4a322347748726))
* setting to control dated vs undated task order ([64299c2](https://github.com/aedades/pomopal/commit/64299c2709bcadfc51fea6f64dc4427214d4d05c))
* Spotify player opt-in via settings ([3b0e1e2](https://github.com/aedades/pomopal/commit/3b0e1e238d4aaa7e0038c3d69f172ef240ba0377))
* stub Spotify integration (not displayed yet) ([0f9763c](https://github.com/aedades/pomopal/commit/0f9763c4a84c961c9704eb33ac73a0ab87454c73))


### Bug Fixes

* add permissions for Firebase deploy workflow ([ac24d7d](https://github.com/aedades/pomopal/commit/ac24d7dbdf601e77c7732aa156a97a2fa5b96c85))
* allow clearing daily goal input while typing ([555fc87](https://github.com/aedades/pomopal/commit/555fc87633ed06cedbce9a0f8a6109d192d7aee4))
* allow clearing daily goal input while typing ([7d4b585](https://github.com/aedades/pomopal/commit/7d4b5856d9ef1c000cff2b005a2a166abd1451c5))
* correct Timezone Buddy URL ([9a87561](https://github.com/aedades/pomopal/commit/9a8756110ea9c0e5c33c4949961d170775e40e06))
* shorten tooltip text to prevent overflow ([27bbb0c](https://github.com/aedades/pomopal/commit/27bbb0c8debd1f52c9acff5f2af76d699a1ed720))
* shorten tooltip text to prevent overflow ([8ab309b](https://github.com/aedades/pomopal/commit/8ab309b8ddd8577dfeee7accb4d3d0606af1a863))
* update Firebase project URLs to pomopal-f14e0 ([4e8b5e2](https://github.com/aedades/pomopal/commit/4e8b5e2d308d9744dd8d834220bc2afea60cf7b3))
* use correct Firebase project ID (pomopal-f14e0) ([d9d7319](https://github.com/aedades/pomopal/commit/d9d731971191defa62816d93d33ff9adf31faea0))
* use correct Settings interface properties in Header tests ([2380e73](https://github.com/aedades/pomopal/commit/2380e734b189ddcb45fc67ef71e3132b2acf307a))


### Reverts

* remove Spotify integration ([7023f9a](https://github.com/aedades/pomopal/commit/7023f9a4fa78c5217fadaad88e5615cedcc23400))

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
