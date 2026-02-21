# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
bun run dev          # Start Nuxt dev server (http://localhost:3000)
bun run build        # Build for production
bun run generate     # Static site generation
bun run preview      # Preview production build

# Tauri desktop app
bun run tauri:dev    # Run as desktop app (starts Nuxt + Tauri)
bun run tauri:build  # Build native desktop app

# Code quality
bun run lint         # ESLint check
bun run lint:fix     # ESLint auto-fix
bun run format       # Prettier format
bun run format:check # Prettier check
bun run check        # lint + format:check
bun run fix          # lint:fix + format
```

No test suite is configured.

## Architecture

**"How's Progress"** is a daily work task tracker. It's a Nuxt 4 SPA (SSR disabled) wrapped in a Tauri v2 desktop shell, using localStorage for persistence — no backend.

### Key layers

- **`pages/index.vue`** — sole route; orchestrates task fetching and passes `addTask` down to `TaskInput`
- **`composables/useTasks.ts`** — global state via module-level `ref<Task[]>`, reads/writes `localStorage` under key `how-is-your-progress-tasks`
- **`composables/useTaskForm.ts`** — vee-validate + Zod form logic for task creation; exports `taskFormSchema`, `TaskForm` type, `TASK_STATUS_OPTIONS`, and `ADD_ELEMENT_OPTIONS`
- **`components/tasks/`** — `TaskInput.vue` (form UI), `TaskInputUrlRow.vue` (URL field row), `TaskItem.vue` (single task display), `TasksList.vue` (list with remove + undo-toast)
- **`components/ui/`** — shadcn-nuxt components (no prefix configured)
- **`types/index.d.ts`** — `Task` interface
- **`types/enums/index.ts`** — `TaskStatus` (`in_progress` | `completed`), `AddElementType`
- **`lib/utils.ts`** — `cn()` helper (clsx + tailwind-merge)

### UI / styling

- Tailwind CSS v4 via `@tailwindcss/vite` plugin
- shadcn-nuxt with `reka-ui` primitives, no component prefix
- `vue-sonner` for toast notifications (delete → undo restore)
- `@nuxt/icon` in CSS mode for Iconify icons

### Tauri integration

- `src-tauri/tauri.conf.json` — window config (800×600, min 600×400)
- Tauri `beforeDevCommand` runs `npm run dev`; `frontendDist` points to `.output/public`
- Currently no Tauri Rust API is used beyond the shell

### Form field extensibility pattern

`useTaskForm` tracks optional field visibility with local `ref` booleans (`hasDescriptionElement`, `hasGitElement`, `hasJiraElement`). `onAddElement(type)` reveals fields; removing them clears both the flag and value. External links are a dynamic array managed manually.
