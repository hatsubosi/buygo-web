# BuyGo Web

Frontend for BuyGo — a group buying and event registration management platform. Built with Angular 21 and a Glassmorphism design system.

## Features

- **Group Buy Browsing & Ordering** — Browse active group buys, add products to cart, checkout with shipping/payment info
- **Event Registration** — View events, select items, register with discount rules applied
- **User Dashboard** — Track order statuses, view payment history, manage registrations
- **Manager Dashboard** — Manage group buys/events, batch update fulfillment statuses, verify payments, view sales stats
- **Admin Panel** — User management, product categories, price templates

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Angular 21 (Standalone Components) |
| Language | TypeScript 5.9 |
| Styling | TailwindCSS 3.4 + SCSS |
| API Client | ConnectRPC (Protobuf/TypeScript) |
| State Management | Angular Signals + RxJS |
| Testing | Vitest 4.0 |
| Linting | ESLint 9 + Prettier 3.6 |
| Runtime | Node 22 LTS |

## Project Structure

```
src/app/
├── core/                        # Core services & providers
│   ├── api/                     # ConnectRPC generated clients (from protobuf)
│   ├── auth/                    # AuthService, guards, interceptors
│   ├── groupbuy/                # GroupBuyService, mappers
│   ├── event/                   # EventService
│   ├── manager/                 # ManagerService
│   ├── layout/                  # Navbar, footer
│   └── utils/                   # Shared utilities
├── features/                    # Feature modules (lazy-loaded routes)
│   ├── home/                    # Landing page
│   ├── auth/                    # Login page
│   ├── groupbuy/                # Group buy list, detail, checkout, order confirmation
│   ├── event/                   # Event list, detail
│   ├── user/                    # User dashboard (orders, registrations)
│   ├── manager/                 # Manager dashboard
│   │   ├── dashboard/           # Overview
│   │   ├── groupbuy-detail/     # Group buy management & sales stats
│   │   ├── groupbuy-form/       # Create/edit group buy
│   │   ├── product-list/        # Product management
│   │   ├── order-list/          # Order listing
│   │   ├── order-detail/        # Order detail & payment verification
│   │   ├── status-dashboard/    # FIFO fulfillment status matrix
│   │   ├── event-detail/        # Event management
│   │   ├── event-form/          # Create/edit event
│   │   ├── event-items/         # Event item management
│   │   └── user-list/           # User listing
│   └── admin/                   # Admin panel (categories, price templates)
└── shared/                      # Shared components & utilities
    ├── pipes/                   # Currency, date pipes
    ├── ui/                      # UI component library (btn, card, dialog, toast)
    └── utils/                   # Status labels, helpers
```

## Getting Started

### Prerequisites

- Node 22 LTS
- npm

### Setup

```bash
npm ci
npm start
```

The dev server starts at `http://localhost:4200/` with hot reload.

> The frontend expects the API server running at `http://localhost:8080`. See [buygo-api](../buygo-api/) for backend setup.

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start dev server (`ng serve`) |
| `npm run build` | Production build to `dist/` |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check formatting without modifying |

## Testing

Unit tests use **Vitest** with Angular TestBed:

```bash
npm test                    # Watch mode
npm run test:coverage       # Single run with coverage
```

- **Coverage gate**: 70% minimum for both statements and lines (enforced in CI)
- **Testing patterns**: Component behavior testing with Angular Signals, service mocking, template rendering

## CI/CD

GitHub Actions pipeline (`.github/workflows/ci.yml`) runs on push/PR to `main` and `dev`:

1. **test** — `npm ci` → format check → `npm audit` → unit tests with coverage → coverage gate (70%) → production build
2. **docker** — Multi-stage Docker image build (Node 22 → nginx Alpine), depends on test passing
