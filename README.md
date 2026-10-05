# GraphMint 🌐✨

> **Next-Generation Distributed Knowledge Graph & System Mapping Platform**

GraphMint is a modern, high-performance platform for visualizing, generating, and exploring complex knowledge graphs and distributed system architectures. Built with microservices on the backend and a Turborepo-powered monorepo on the frontend, GraphMint delivers seamless web and desktop experiences.

---

## 🏗️ Repository Architecture

The GraphMint repository is structured into two primary ecosystems:

```
GraphMint/
├── client/                     # Turborepo Monorepo (Frontend & Desktop)
│   ├── apps/
│   │   ├── desktop/            # Electron + Vite + React Desktop Application (Pure JS Electron)
│   │   └── web/                # Next.js 16 (App Router + Turbopack) Web Application
│   ├── packages/
│   │   ├── ui/                 # @repo/ui: Shared Shadcn UI components & global design tokens
│   │   └── api/                # @repo/api: Standardized API client, endpoints & TanStack Query hooks
│   ├── pnpm-workspace.yaml     # pnpm workspace definition
│   ├── turbo.json              # Turborepo pipeline configuration
│   └── package.json            # Client root scripts & Turborepo orchestration
│
└── server/                     # Microservices Monorepo (Backend)
    ├── apps/
    │   ├── gateway/            # API Gateway with Fastify & reverse proxy
    │   ├── core-service/       # Graph data models, nodes, edges & projects
    │   ├── ai-service/         # AI-powered graph generation, node suggestion & chat
    │   ├── platform-service/   # Authentication, user governance & settings
    │   └── import-export-service/ # High-throughput graph schema import/export
    ├── packages/
    │   ├── database/           # Prisma ORM & PostgreSQL database models
    │   ├── cache/              # Redis caching layer
    │   ├── service-config/     # Fastify plugins, logging & rate-limiting
    │   ├── contract/           # Service schemas & contracts
    │   └── utils/              # Shared backend utility functions
    ├── docker.compose.yml      # Infrastructure (PostgreSQL 17, Redis 8, NATS, Kafka)
    └── turbo.json              # Backend Turborepo pipeline
```

---

## ⚡ Tech Stack

### Client Architecture
| Layer | Technologies |
|---|---|
| **Monorepo Engine** | [Turborepo](https://turbo.build/) + [pnpm](https://pnpm.io/) Workspaces |
| **Web Application** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack, React 19) |
| **Desktop Application** | [Electron](https://www.electronjs.org/) (Pure JavaScript `main.js` / `preload.js`) + [Vite](https://vite.dev/) |
| **Shared UI Package** | [Shadcn UI](https://ui.shadcn.com/) (`@repo/ui`) + [Tailwind CSS v4](https://tailwindcss.com/) |
| **Shared API Layer** | Axios + [TanStack React Query v5](https://tanstack.com/query) (`@repo/api`) |
| **Client State** | [Zustand](https://zustand.docs.pmnd.rs/) (Fast, lightweight reactive state management) |
| **Iconography** | [Lucide React](https://lucide.dev/) |

### Server Architecture
| Component | Technologies |
|---|---|
| **API Framework** | [Fastify](https://fastify.dev/) (High-performance Node.js framework) |
| **Database & ORM** | [PostgreSQL 17](https://www.postgresql.org/) + [Prisma](https://www.prisma.io/) |
| **Caching** | [Redis 8](https://redis.io/) |
| **Event Streaming** | [NATS](https://nats.io/) (JetStream) & [Apache Kafka](https://kafka.apache.org/) |
| **Gateway** | Fastify HTTP Reverse Proxy routing to microservices |

---

## 📦 Shared Client Packages

### 1. `@repo/ui` — Centralized Shadcn UI & Design System
All UI components and CSS variable themes live in [`client/packages/ui`](file:///d:/Project/GraphMint/client/packages/ui) so that both Next.js and Electron share identical aesthetics and design tokens:
- **Global CSS** (`globals.css`): Modern OKLCH color palettes, dark/light mode CSS variables, border radius, and typography tokens.
- **Component Suite**: `Button`, `Card`, `Badge`, `Input`, `Label`, `Textarea`, `Dialog`, `Alert`, `AlertDialog`, `Avatar`, `Checkbox`, `DropdownMenu`, `Popover`, `Progress`, `RadioGroup`, `Select`, `Separator`, `Sheet`, `Skeleton`, `Slider`, `Switch`, `Table`, `Tabs`, `Tooltip`, `Accordion`, `AspectRatio`, `Breadcrumb`, `Collapsible`, `HoverCard`, `Menubar`, `ScrollArea`, `Toggle`, `ToggleGroup`, `Sonner` (Toaster).
- **Utility**: `cn(...)` using `clsx` and `tailwind-merge`.

### 2. `@repo/api` — Standardized API & Query Hooks
All backend communication is standardized in [`client/packages/api`](file:///d:/Project/GraphMint/client/packages/api):
- **Centralized Endpoints** (`src/endpoints.js`): Defined paths for Core, Platform, AI, and Import/Export microservices.
- **HTTP Client** (`src/client.js`): Axios client with auto-detecting base URL (`NEXT_PUBLIC_API_URL` / `VITE_API_URL` / `localhost:3000`), automatic bearer token injection, and structured error formatting.
- **TanStack Query Hooks** (`src/hooks/`):
  - `useCoreHealth()`, `useGraphs()`, `useGraphDetail()`, `useCreateGraph()`, `useNodes()`, `useEdges()`
  - `usePlatformHealth()`, `useCurrentUser()`, `useLogin()`, `useRegister()`, `useLogout()`, `useSettings()`
  - `useAiHealth()`, `useAiGenerateGraph()`, `useAiSuggestNodes()`, `useAiChat()`
- **Query Provider** (`src/provider.jsx`): Shared `<ApiQueryProvider>` with smart caching and retry defaults.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v20+ (Node v24 recommended)
- **pnpm**: v9+ or v12+ (`corepack enable pnpm`)
- **Docker**: For running database and message brokers (optional for UI-only development)

### 1. Start Infrastructure (Backend Services)
```bash
cd server
docker compose up -d
pnpm install
pnpm dev
```
*The API Gateway starts on `http://localhost:3000`.*

### 2. Start Client Applications (Turborepo)
```bash
cd client
pnpm install
```

#### Run All Client Apps Concurrently:
```bash
pnpm dev
```

#### Run Specific Client App:
```bash
# Run Electron Desktop App (Vite + Electron)
pnpm dev:desktop

# Run Next.js Web App
pnpm dev:web
```

---

## 🛠️ Turborepo Commands (in `client/`)

| Command | Action |
|---|---|
| `pnpm dev` | Starts all apps in dev mode via Turborepo |
| `pnpm dev:desktop` | Runs only Electron Desktop application |
| `pnpm dev:web` | Runs only Next.js Web application |
| `pnpm build` | Builds all apps and packages with dependency caching |
| `pnpm build:desktop` | Builds Vite bundle for desktop |
| `pnpm build:web` | Builds optimized Next.js production output |
| `pnpm clean` | Cleans `.turbo` caches |

---

## 🖥️ Electron Architecture Guideline
In GraphMint Desktop:
- **Always use pure JavaScript (`.js`)** for Electron processes (`main.js` and `preload.js`).
- Secure IPC communication is enforced via `contextBridge` with node integration disabled and context isolation enabled.
- Renderer UI uses React JSX bundled by Vite with Tailwind CSS v4.

---

## 📄 License
This project is proprietary and confidential. All rights reserved.
