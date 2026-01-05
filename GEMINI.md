# Gemini Context: yew-tab

## 1. Project Overview
**Name:** `yew-tab`
**Description:** A browser extension (Manifest V3, primarily for Edge/Chrome) that replaces the "New Tab" page with a custom, React-based interface. It focuses on bookmark management and a clean user experience.

## 2. Technology Stack
- **Framework:** React 18
- **Language:** TypeScript
- **Build Tool:** Vite 5
- **Extension Type:** Manifest V3
- **Package Manager:** pnpm (preferred)

## 3. Directory Structure
- **`src/newtab`**: The main frontend application for the new tab page.
    - `main.tsx`: Entry point.
    - `app.tsx`: Root component.
    - `components/`: UI components (e.g., `bookmark-card`, `folder-card`).
- **`src/background`**: Background service worker scripts (`index.ts`).
- **`src/lib`**: Core logic and API wrappers.
    - `bookmarks/`: Chrome Bookmarks API wrappers.
    - `messaging/`: Internal extension messaging.
    - `storage/`: Persistence logic.
- **`src/shared`**: Shared resources across background and frontend.
    - `types/`: TypeScript definitions.
    - `constants/`: Global constants.
- **`helloagents/`**: Project documentation, architectural decisions, and development plans.
    - `wiki/`: Detailed architectural and module documentation.
    - `plan/`: Task tracking and roadmaps.

## 4. Development & Build

### Commands
- **Install Dependencies:** `pnpm install`
- **Development Server:** `pnpm dev` (Runs Vite in watch mode)
- **Production Build:** `pnpm build` (Outputs to `dist/`)
- **Lint:** `pnpm lint`

### Loading the Extension
1.  Run `pnpm build`.
2.  Open `chrome://extensions` or `edge://extensions`.
3.  Enable "Developer mode".
4.  Click "Load unpacked" and select the `dist` directory.

## 5. Key Conventions & Guidelines
- **Language:** Code comments and documentation are primarily in **Chinese**.
- **File Naming:** strictly `kebab-case` (lowercase with hyphens).
- **Code Style:** Functional components with Hooks.
- **Error Handling:** Catch critical exceptions to prevent the new tab page from crashing.
- **Commits:** Follow **Conventional Commits** (e.g., `feat: ...`, `fix: ...`).
- **Documentation:** Refer to `helloagents/wiki` for architectural details and `helloagents/plan` for current tasks.

## 6. Architecture Highlights
- **Build Output:** Multi-entry build via Vite. `newtab.html` is the entry for the tab page, and `background/index.ts` compiles to the service worker.
- **State Management:** Relies on React state and direct Chrome API calls wrapped in `src/lib`.
- **Logic Separation:** Keep raw `chrome.*` API calls inside `src/lib` modules to maintain clean UI components.
