# pomo pal 🍅

A friendly pomodoro timer PWA with push notifications, multi-device sync, and flow mode.

**Live:** https://pomopal.web.app

## Features

- 🍅 **Pomodoro Timer** — Configurable work/break durations (25/5/15 default)
- 🔔 **Push Notifications** — Get notified when timer ends, even with screen locked (iOS 16.4+)
- 🔄 **Multi-Device Sync** — Sign in with Google, data syncs everywhere
- ⏱️ **Flow Mode** — Count up instead of down for extended focus sessions
- ✅ **Tasks & Projects** — Organize work with color-coded projects
- 📊 **Estimates** — Track estimated vs actual pomodoros per task
- 🎯 **Daily Goal** — Progress visualization
- 🌙 **Dark Mode** — Easy on the eyes
- ⌨️ **Keyboard Shortcuts** — Space to start/pause
- 📱 **PWA** — Install on home screen for full-screen experience

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS
- **Backend:** Firebase (Auth, Firestore, Cloud Functions, Cloud Messaging)
- **Hosting:** GitHub Pages (frontend) or Firebase Hosting
- **Testing:** Vitest + React Testing Library

## Project Structure

```
pomodoro/
├── frontend/                # React PWA
│   ├── src/
│   │   ├── components/      # UI components (Timer, TaskList, etc.)
│   │   ├── hooks/           # React hooks (useTimer, useSettings, etc.)
│   │   ├── context/         # TaskContext for state management
│   │   ├── lib/             # Firebase config, device detection
│   │   └── test/            # Test setup
│   ├── public/              # Static assets, manifest, service worker
│   └── vitest.config.ts     # Test configuration
├── functions/               # Firebase Cloud Functions
│   └── src/index.ts         # Timer notification scheduler
├── firebase.json            # Firebase project config
├── firestore.rules          # Security rules
└── firestore.indexes.json   # Database indexes
```

## Local Development

```bash
# Install dependencies
cd frontend
npm install

# Run dev server
npm run dev
# Open http://localhost:5173

# Run tests
npm test

# Build for production
npm run build
```

## Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project
3. Enable services:
   - **Authentication** → Google sign-in
   - **Firestore** → Create database (production mode)
   - **Cloud Messaging** → Generate VAPID key

### 2. Configure Environment

```bash
cp frontend/.env.example frontend/.env
# Edit with your Firebase config values
```

### 3. Deploy Firestore Rules

```bash
firebase login
firebase use --add
firebase deploy --only firestore:rules,firestore:indexes
```

### 4. Deploy Cloud Functions

```bash
cd functions
npm install
npm run deploy
```

## Deployment

### Environments

| Environment | URL | Trigger |
|-------------|-----|---------|
| **Preview** | `pomopal--pr-XXX.web.app` | PR opened |
| **Staging** | `pomopal--staging.web.app` | Push to `main` |
| **Production** | `pomopal.web.app` | Manual deploy |

### Deploy to Production

**Via GitHub UI:**
1. Go to **Actions** → **Deploy to Production**
2. Click **Run workflow**
3. Enter version (e.g., `v1.0.0`) or leave empty for latest
4. Click **Run**

**Via CLI (requires `gh` CLI):**
```bash
# Deploy specific version
gh workflow run deploy-production.yml -f version=v1.0.0

# Deploy latest release
gh workflow run deploy-production.yml

# Check deployment status
gh run list --workflow=deploy-production.yml
```

### Release Process

1. Merge PRs with `feat:` or `fix:` prefixes
2. Release-please auto-creates a Release PR
3. Merge Release PR → creates GitHub release + tag
4. Deploy when ready: `gh workflow run deploy-production.yml`

### Manual Firebase Deploy

```bash
cd frontend
npm run build
firebase deploy --only hosting
```

## iOS Push Notifications

For notifications on iOS:

1. **Add to Home Screen** — Share → Add to Home Screen
2. **Grant permission** — Allow notifications when prompted
3. **Requires iOS 16.4+**

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

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

**Test coverage:**
- Device detection (iOS, Safari, PWA)
- Timer hook (start, pause, reset, mode switching)
- Settings persistence
- Task/Project CRUD operations
- UI components

## Guest Mode

Works without Firebase — data stored in localStorage:
- Full timer functionality
- Tasks and projects
- Settings persistence
- No sync, no notifications when screen locked

## Privacy

- Auth via Google (no passwords stored)
- Data in your Firebase project (you control it)
- No analytics or tracking
- Guest mode = 100% local, nothing leaves device

## Cost

Firebase free tier covers personal use:
- **Auth:** Unlimited
- **Firestore:** 50K reads, 20K writes/day
- **Functions:** 2M invocations/month
- **Cloud Messaging:** Unlimited
- **GitHub Pages:** Free

## License

MIT
