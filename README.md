# LexiRead

**LexiRead** is an intelligent PDF reader and vocabulary learning **Progressive Web App (PWA)**. Read PDFs in the browser, look up words without leaving the page, save vocabulary locally, and get spaced-repetition reminders—all on your device with no backend server.

## Run the app

```powershell
cd "C:\Users\user\Documents\EEE 2.2\Lexiread"
npm install
npm run dev
```

Open the URL shown in the terminal (usually **http://localhost:5173**).

### Other commands

| Command | Purpose |
|---------|---------|
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |

## Project structure

```
src/
  classes/       # ES6 business logic (one class per file)
  components/    # React UI (thin views only)
  context/       # AppServicesContext — injects service classes
  db/            # Dexie / IndexedDB schema
  hooks/         # React hooks (tab state, etc.)
  pages/         # Tab screens
  styles/        # Tailwind entry CSS
public/          # Static assets (icon, etc.)
```

## Technology stack

| Technology | Role in LexiRead |
|------------|------------------|
| React 18 + Vite + TypeScript | UI framework and build tool |
| Tailwind CSS | Mobile-first styling |
| vite-plugin-pwa (Workbox) | Offline shell caching, installable PWA |
| Dexie.js | IndexedDB wrapper (Phase 2+) |
| pdfjs-dist | PDF rendering (Phase 4+) |
| lucide-react | Icons |
| Free Dictionary API | Word definitions (Phase 6+) |
| Wikipedia REST API | Context summaries (Phase 6+) |

## Build phases (roadmap)

| Phase | Status |
|-------|--------|
| 1 — Project scaffold | ✅ Done |
| 2 — Data layer | ✅ Done |
| 3 — File manager + Files/Recents | ✅ Done |
| 4 — PDF viewer | ✅ Done |
| 5 — Annotations | ✅ Done |
| 6 — Vocabulary lookup | ✅ Done |
| 7 — Vocabulary library | ✅ Done |
| 8 — Notifications | ✅ Current |
| 9 — Settings | ✅ Done |
| 10 — Polish & PWA | Pending |

## Core classes (OOP)

- `DataStore` — single IndexedDB access point  
- `FileManager` — import, list, sort, rename PDFs  
- `PDFRendererAdapter` — PDF.js rendering  
- `AnnotationEngine` — highlights and notes  
- `VocabManager` — lookup and vocabulary library  
- `DictionaryAPIClient` / `WikipediaAPIClient` — external APIs  
- `NotificationScheduler` — spaced-repetition push  
- `SearchController` — filter and sort  
- `SettingsManager` — user preferences  

React components call these classes via `AppServicesContext`; they do not contain business logic.

## Data layer

IndexedDB stores (via Dexie): `documents`, `vocabulary`, `annotations`, `settings`, `notificationLog`.

**Dev check:** With `npm run dev`, open the browser console (F12). On load you should see:

`[LexiRead] DB ready — stores: documents, vocabulary, annotations, settings, notificationLog`

All persistence goes through the `DataStore` class in `src/classes/DataStore.ts`. Entity types live in `src/db/types.ts`.

## Vocabulary notifications (Phase 8)

LexiRead can remind you with a random saved word and its definition on a schedule (1h, 12h, or 24h).

### Testing on localhost

1. Save at least one word to **Library**.
2. Open **Settings** → enable **Notifications** → allow permission when prompted.
3. Tap **Send test notification** to verify immediately.
4. Reminders also run on a timer while the app is open (or the PWA is active).

Notifications use the **Web Notifications API** (not a push server). They work on `http://localhost` in Chrome for development.

### Installed PWA (Android / desktop)

- The user must grant notification permission.
- **HTTPS** is required on real devices (installed PWAs from a secure origin).
- If permission is denied, LexiRead continues to work without reminders.

### Spaced repetition (V1 stub)

Words due for review (`nextReviewAt` in the past) are preferred. Tapping a notification doubles the review interval (stub — full SRS in a future version).

Delivery is logged in IndexedDB (`notificationLog` store).

## License

Educational project — EEE 2.2.
