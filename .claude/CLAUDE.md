# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## System prompt

- Always respond in English.
- Contradict me if I'm not right.
- When I ask you a question, only respond without writing code unless it's necessary for the answer.
- Use clear and concise language.
- Avoid unnecessary technicalities.
- If my questions are ambiguous, ask for clarifications before responding.
- Do not make assumptions about my intentions or context beyond what you've been explicitly told.
- Only write the code necessary for the feature in question.
- Do not write comments in the code unless strictly necessary.
- Do not write summaries or documentation unless expressly requested.
- If you do not have enough information to answer my question, tell me clearly.
- If you do not have enough context to continue with the task, ask me for more information before proceeding.
- Do not invent code syntax, you can search the internet if needed.
- If the same error occurs more than 3 times, stop and notify the user.

## Project Overview

**import-plugin** is a Strapi 5.x plugin for data import/export functionality. It follows Strapi's dual-export plugin architecture:

- Admin Panel UI (`./strapi-admin`): React 18.3 + TypeScript in `/admin`
- Server Backend (`./strapi-server`): Node.js + TypeScript in `/server`

## Commands

### Build & Development

```bash
npm run build              # Build plugin (dist/ output with dual exports)
npm run watch             # Watch mode for development
npm run watch:link        # Link plugin to local Strapi installation
npm run verify            # Verify plugin structure
```

### Type Checking

```bash
npm run test:ts:front     # TypeScript check for admin (/admin)
npm run test:ts:back      # TypeScript check for server (/server)
```

**Note**: No automated test suite exists; only TypeScript validation is available.

## Architecture

### Key Structure

```
admin/src/
├── index.ts              → Plugin entry point (registers menu link, lazy-loads pages)
├── components/           → Reusable UI components (Initializer, PluginIcon)
├── pages/                → Page components (App.tsx, HomePage.tsx)
├── translations/         → i18n JSON files per locale
└── utils/                → Helpers (getTranslation)

server/src/
├── index.ts              → Plugin export (routes, services, controllers, etc.)
├── bootstrap.ts          → Strapi startup initialization hook
├── register.ts           → Server-side plugin registration
├── destroy.ts            → Cleanup hook
├── routes/content-api.ts → API endpoint definitions
├── controllers/          → HTTP handlers (delegate to services)
├── services/             → Business logic (stateless functions)
├── config/               → Plugin configuration schema
└── [content-types, policies, middlewares]/
```

### Admin Entry Point (`admin/src/index.ts`)

- **Menu Registration**: `app.addMenuLink()` with lazy-loaded page component (`import('./pages/App')`)
- **Plugin ID**: Scoped via `PLUGIN_ID` constant from `pluginId.ts` (used throughout for namespacing)
- **i18n**: Registered via `registerTrads()` with fallback to empty object if locale unavailable

### Server Entry Point (`server/src/index.ts`)

Exports plugin object with hooks:

- `register`, `bootstrap`, `destroy`: Application lifecycle
- `routes`, `controllers`, `services`: Core logic
- `config`, `contentTypes`, `policies`, `middlewares`: Plugin extension points

### Request Flow

1. Admin UI → API endpoint
2. Route handler in `server/src/routes/content-api.ts` → controller via `'controller.index'`
3. Controller calls service: `strapi.plugin('import-plugin').service('serviceName')`
4. Service returns data; controller sets `ctx.body`

**Critical**: Controllers/services receive `{ strapi }` injected. Access plugin-scoped services via `strapi.plugin('import-plugin').service('serviceName')`.

## Key Conventions

### Build Output & Exports

- **CommonJS + ESM**: Dual exports in `dist/`
  - Admin: `./dist/admin/index.js` + `./dist/admin/index.mjs`
  - Server: `./dist/server/index.js` + `./dist/server/index.mjs`
- **TypeScript configs**: `admin/tsconfig.build.json`, `server/tsconfig.build.json` (built by strapi-plugin)

### Module Resolution

- **Admin**: Lazy dynamic imports for page components (see `admin/src/index.ts`)
- **Server**: Direct imports; ensure `services`/`controllers` are indexed in respective `index.ts`
- **Naming**: Controllers/services = single default export function; Routes = array of route objects

### TypeScript

- **Admin**: React 18.3, styled-components, react-intl for i18n
- **Server**: Core types from `@strapi/strapi` (e.g., `Core.Strapi`)
- **Both**: Extends Strapi's TypeScript utils for config inheritance

### Common Development Tasks

- **Add API endpoint**: Define in `routes/content-api.ts`, create handler in `controllers/`, implement logic in `services/`
- **Add UI component**: Place in `admin/src/components/`, import in pages
- **Internationalization**: Add key-value pairs to `admin/src/translations/{locale}.json`, use `getTranslation()` helper

## Dependencies

### UI/Admin

- `@strapi/design-system` (v2.0.0-rc.30): Strapi UI components
- `@strapi/icons` (v2.0.0-rc.30): Icon library
- `react-intl` (v7.1.14): i18n framework
- `styled-components` (v6.1.19): CSS-in-JS styling
- `react-router-dom` (v6.30.2): Client-side routing

### Core

- `@strapi/strapi` (v5.31.0): Strapi peer dependency
- `@strapi/sdk-plugin` (v5.3.2): Plugin SDK peer dependency

### Development

- `typescript` (v5.9.3): Type checking
- `prettier` (v3.6.2): Code formatting
- `@strapi/typescript-utils` (v5.31.0): TypeScript config utils

## Important Notes

1. **PLUGIN_ID scoping**: Always use `PLUGIN_ID` constant for namespacing menu links, routes, and service lookups.
2. **No tests found**: Only TypeScript validation (`test:ts:*` scripts) exists; no Jest suite in package.json.
3. **Copilot instructions**: See `.github/copilot-instructions.md` for detailed architecture reference.
4. **Package exports**: Dual exports configured in `package.json` under `exports` field; ensure both CommonJS and ESM variants work after build.

## Documentation

- Create a plugin for Strapi: https://docs.strapi.io/cms/plugins-development/create-a-plugin#getting-started-with-the-plugin-sdk
- Plugin SDK reference: https://docs.strapi.io/cms/plugins-development/plugin-sdk
- Structure a plugin: https://docs.strapi.io/cms/plugins-development/plugin-structure
- Admin Panel API for plugins: https://docs.strapi.io/cms/plugins-development/admin-panel-api
