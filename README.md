# ElsaBeauty-FE

A modern, role-aware single-page application for a beauty clinic — booking, real-time chat, and notifications.
Built with React 18, TypeScript, and Vite, talking to the [BeautyClinic-BE](https://github.com/Kevjo15/BeautyClinic-BE) API.

Live: [zealous-moss-037161903.2.azurestaticapps.net](https://zealous-moss-037161903.2.azurestaticapps.net)

---

## Highlights

- **Role-based UI** — separate dashboards and routes for customers, employees, and admins
- **Secure auth** — in-memory access token + silent refresh via HttpOnly cookie (no tokens in `localStorage`)
- **Resilient API client** — Axios interceptors with a single-flight refresh queue that retries failed requests after re-auth
- **Real-time** — SignalR for booking-scoped chat and live notifications, auto-reconnect
- **Booking flow** — service selection, employee picker, live availability, confirmation
- **Image handling** — short-lived SAS URLs from the backend with graceful loading/fallback states
- **Theming** — light/dark mode with DaisyUI + Tailwind
- **Type-safe forms** — React Hook Form + Zod validation

---

## Tech Stack

| Concern | Choice |
|---------|--------|
| Framework | React 18 + TypeScript |
| Build tool | Vite 6 |
| Routing | React Router 7 |
| Styling | Tailwind CSS 4 + DaisyUI 5 |
| HTTP | Axios (with refresh interceptors) |
| Real-time | `@microsoft/signalr` |
| Forms | React Hook Form + Zod |
| Auth decoding | `jwt-decode` |
| Dates | `date-fns` + `react-day-picker` |
| Notifications (toast) | `sonner` |
| Icons | `lucide-react` |
| Hosting | Azure Static Web Apps |

---

## Architecture

```
src/
├── pages/              Route-level views (13 pages)
│   ├── HomePage, LoginPage, RegisterPage
│   ├── CustomerDashboard, EmployeeDashboard, AdminDashboard
│   ├── ServicesPage, ServiceDetailsPage
│   ├── BookingPage, BookingConfirmationPage, BookingsHistoryPage
│   ├── ChatPage, ProfilePage
├── components/         Reusable UI
│   ├── booking/        Service/employee/date/time selectors, summary, modal
│   ├── landing/        Hero, AboutElsa, WhyChoose, CallToAction
│   ├── schedule/       Weekly schedule editors
│   ├── layout/         Layouts, footer, nav
│   ├── ImageWithFallback, NotificationCenter, BookingChat, ...
├── contexts/           SignalRContext, ChatStateContext
├── hooks/              Data + behavior hooks (useServices, useTimeSlots, useSignalRChat, ...)
├── services/
│   ├── api/            Axios instance, auth, endpoint modules, token store
│   └── chat/           Chat/booking resolution helpers
└── App.tsx             Provider composition + route table
```

### Provider Composition

The app wraps everything in a deliberate provider order:

```
Router
 └─ AuthProvider          (auth state, login/logout, user restore)
     └─ SignalRProvider   (chat + notification hubs, gated on auth)
         └─ ChatStateProvider
             └─ ThemeProvider
```

SignalR connections only start once auth is resolved, so hubs always connect with a valid token.

### Routing

Public routes: `/`, `/login`, `/register`.
Everything else is wrapped in `<ProtectedRoute>`, which redirects unauthenticated users to login.

---

## Authentication

The frontend pairs with the backend's JWT + refresh-token design:

- **Access token** lives in memory (a module-level token store) — never in `localStorage`, reducing XSS exposure.
- **Refresh token** is an HttpOnly cookie the browser sends automatically (`withCredentials: true`).
- **On app load**, `AuthProvider` calls the refresh endpoint to silently restore the session from the cookie.
- **On 401**, the Axios response interceptor refreshes the token and retries the original request.

### Single-flight refresh queue

When several requests 401 at once, only **one** refresh call fires. The rest queue up and replay with the new token once refresh resolves — no thundering herd, no duplicate refreshes:

```
Request A → 401 ─┐
Request B → 401 ─┼─→ one refresh call → all retried with new token
Request C → 401 ─┘
```

If refresh fails, the queue is rejected, the token is cleared, and an `authExpired` event drops the user to login.

---

## Real-time (SignalR)

Two hubs, managed centrally in `SignalRContext`:

- **Chat hub** — booking-scoped messaging between a customer and their assigned employee
- **Notification hub** — booking confirmations, reminders, and unread counts

Connections authenticate via the access token, track status (`connecting` / `connected` / `reconnecting`), and auto-reconnect. Unread state is derived in `ChatStateContext` and surfaced in the `NotificationCenter`.

---

## Getting Started

### Prerequisites

- Node.js 18+
- The [backend](https://github.com/Kevjo15/BeautyClinic-BE) running locally (default `http://localhost:5011`)

### 1. Install

```bash
npm install
```

### 2. Configure environment

Create a `.env` file in the project root:

```bash
VITE_API_BASE_URL=/api
VITE_SIGNALR_BASE_URL=http://localhost:5011
VITE_STORAGE_BASE_URL=http://127.0.0.1:10000/devstoreaccount1
```

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Base path for REST calls (proxied to backend in dev) |
| `VITE_SIGNALR_BASE_URL` | SignalR hub origin |
| `VITE_STORAGE_BASE_URL` | Blob storage origin for direct image URLs (Azurite locally) |

### 3. Run

```bash
npm run dev
```

App runs at `http://localhost:5173`.

### 4. Build

```bash
npm run build      # type-check + production build
npm run preview    # preview the production build
npm run lint       # ESLint
```

---

## Deployment

Hosted on **Azure Static Web Apps** via GitHub Actions. The workflow injects production `VITE_*` values from repository variables at build time. Pushes to the deployment branch trigger an automatic build and release.

---

## License

MIT.
