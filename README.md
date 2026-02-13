# pomo pal 🍅

A friendly pomodoro timer PWA with push notifications, multi-device sync, and productivity insights.

**Live:** https://pomopal-f14e0.web.app

## Features

- 🍅 **Pomodoro Timer** — Configurable work/break durations (25/5/15 default)
- 🔔 **Push Notifications** — Get notified when timer ends, even with screen locked (iOS 16.4+)
- 🔄 **Multi-Device Sync** — Sign in with Google, tasks/timer/settings sync everywhere
- ⏱️ **Flow Mode** — Count up instead of down for extended focus sessions
- ✅ **Tasks & Projects** — Organize work with color-coded projects and due dates
- 📊 **Productivity Insights** — Most productive day/hour, streaks, estimation accuracy
- 🎯 **Daily Goal** — Progress visualization with optional weekend exclusion from streaks
- 📅 **Due Dates** — Schedule tasks with optional time
- 🌙 **Dark Mode** — Easy on the eyes
- ⌨️ **Keyboard Shortcuts** — Space to start/pause, N for new task, S for settings
- 📱 **PWA** — Install on home screen for full-screen experience

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS
- **Backend:** Firebase (Auth, Firestore, Cloud Functions, Cloud Messaging)
- **Hosting:** Firebase Hosting
- **CI/CD:** GitHub Actions (tests on PR, auto-deploy on merge)
- **Versioning:** Release-please (semantic versioning from conventional commits)
- **Testing:** Vitest + React Testing Library

## Project Structure

```
pomopal/
├── frontend/                # React PWA
│   ├── src/
│   │   ├── components/      # UI components (Timer, TaskList, Header, etc.)
│   │   ├── hooks/           # React hooks (useTimer, useSettings, useStats, etc.)
│   │   ├── context/         # AuthContext, TaskContext for state management
│   │   ├── lib/             # Firebase config, device detection
│   │   └── test/            # Test setup
│   ├── public/              # Static assets, manifest, service worker
│   └── vite.config.ts       # Build configuration
├── functions/               # Firebase Cloud Functions
│   └── src/index.ts         # Timer notification scheduler
├── firebase.json            # Firebase project config
├── firestore.rules          # Security rules
└── .github/workflows/       # CI/CD workflows
```

## Local Development

```bash
# Install dependencies
npm install        # Root (for functions)
cd frontend && npm install

# Run dev server
npm run dev        # or: make dev
# Open http://localhost:5173

# Run tests
npm test           # or: make test

# Build for production
npm run build      # or: make build
```

## Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project (or use existing)
3. Enable services:
   - **Authentication** → Google sign-in provider
   - **Firestore** → Create database in production mode
   - **Cloud Messaging** → Generate VAPID key for web push

### 2. Configure Environment

```bash
cp frontend/.env.example frontend/.env.production
# Edit with your Firebase config values from Project Settings → General
```

### 3. Deploy Firestore Rules

```bash
firebase login
firebase use --add
firebase deploy --only firestore:rules
```

### 4. Deploy Cloud Functions

```bash
cd functions
npm install
firebase deploy --only functions
```

## Deployment

### Auto-Deploy (Recommended)

Push to `main` triggers automatic deployment via GitHub Actions:
1. CI runs tests
2. On success, deploys to Firebase Hosting

### Manual Deploy

```bash
cd frontend
npm run build
firebase deploy --only hosting
```

### Release Process

1. Create PRs with conventional commit prefixes (`feat:`, `fix:`, `docs:`, etc.)
2. Merge to `main` → release-please creates a Release PR
3. Merge Release PR → creates GitHub release with changelog

## Data Model

### Signed In (Firestore)
- Real-time sync across all devices
- Timer state syncs instantly
- Settings sync across devices
- Push notifications (iOS 16.4+ requires PWA)

### Signed Out (Guest Mode)
- Data stored in localStorage
- Full functionality except push notifications
- No sync between devices
- Data stays on device only

**Note:** Guest and signed-in data are separate. Signing out doesn't transfer cloud data to local, and signing in doesn't merge local data to cloud. This is intentional for privacy on shared devices.

## iOS Setup

For the best experience on iOS:

1. **Open in Safari** — Other browsers don't support PWA features
2. **Add to Home Screen** — Share button → "Add to Home Screen"
3. **Grant Notifications** — Allow when prompted (requires iOS 16.4+)

The app detects iOS and shows setup instructions automatically.

## Cloud Functions

| Function | Purpose |
|----------|---------|
| `scheduleTimerNotification` | Schedules push notification when timer starts |
| `cancelTimerNotification` | Cancels notification when timer is paused/reset |
| `checkTimers` | Runs every minute, sends notifications for completed timers |

## Testing

```bash
cd frontend

# Run all tests
npm test

# Run once (CI mode)
npm test -- --run

# Watch mode
npm test -- --watch

# With coverage
npm test -- --coverage
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Start/pause timer |
| `N` | New task |
| `S` | Open settings |

## Settings

| Setting | Description |
|---------|-------------|
| Work/Break durations | Customize timer lengths |
| Daily goal | Target pomodoros per day |
| Exclude weekends from streak | Don't break streak for missing Sat/Sun |
| Auto-start breaks | Automatically begin break after work session |
| Flow mode | Count up instead of down |
| Move completed to bottom | Auto-sort completed tasks |
| Show dated tasks first | Prioritize tasks with due dates |

## Privacy

- **Auth:** Google sign-in only (no passwords stored)
- **Data:** Stored in your Firebase project (you control it)
- **Analytics:** None
- **Guest mode:** 100% local, nothing leaves device

## Firebase Free Tier

Personal use easily fits in free tier:
- **Auth:** Unlimited users
- **Firestore:** 50K reads, 20K writes/day
- **Functions:** 2M invocations/month
- **Cloud Messaging:** Unlimited
- **Hosting:** 10GB storage, 360MB/day transfer

## License

MIT
