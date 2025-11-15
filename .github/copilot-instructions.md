# AI Copilot Instructions for import-plugin

## Project Overview

This is a **Strapi 5.x plugin** for data import functionality with dual architecture:

- **Admin Panel** (`/admin`): React TypeScript UI for users
- **Backend** (`/server`): Node.js TypeScript server-side logic

The plugin follows Strapi's plugin architecture and is built as a dual export package (`./strapi-admin` and `./strapi-server`).

## Architecture & Key Patterns

### Directory Structure

```
admin/                 → React/TypeScript front-end
  src/
    pages/           → Page components (App.tsx, HomePage.tsx)
    components/      → Reusable UI components (Initializer, PluginIcon)
    utils/           → Helpers (getTranslation)
    translations/    → i18n JSON files per locale

server/                → Node.js/TypeScript back-end
  src/
    controllers/     → HTTP request handlers, delegate to services
    services/        → Business logic, stateless functions
    routes/          → Define API endpoints (content-api routes only)
    config/          → Plugin configuration schema
    bootstrap.ts     → Initialization on Strapi startup
    register.ts      → Plugin registration metadata
```

### Admin Entry Point (`admin/src/index.ts`)

- Registers menu link via `app.addMenuLink()`
- Uses lazy loading for page component: `import('./pages/App')`
- Registers i18n translations via `registerTrads()` with fallback to empty object
- **Key constant**: `PLUGIN_ID` from `pluginId.ts` (used throughout for scoping)

### Server Entry Point (`server/src/index.ts`)

Exports a plugin object with methods:

- `register`: Server-side plugin registration
- `bootstrap`: Initialization hook
- `destroy`: Cleanup hook
- `config`, `routes`, `services`, `controllers`, `contentTypes`, `policies`, `middlewares`

### Request Flow

1. Admin UI sends request to API endpoint
2. Route handler in `server/src/routes/content-api.ts` → `'controller.index'`
3. Controller calls service via `strapi.plugin('import-plugin').service('service')`
4. Service returns data; controller sets `ctx.body`

**Important**: Controllers and services receive `{ strapi }` injected. Access plugin-scoped services via `strapi.plugin('import-plugin').service('serviceName')`.

### Build & Export Configuration

- Build output: `dist/` directory with dual exports
  - Admin: `./dist/admin/index.js` + `./dist/admin/index.mjs`
  - Server: `./dist/server/index.js` + `./dist/server/index.mjs`
- TypeScript build configs: `admin/tsconfig.build.json`, `server/tsconfig.build.json`

## Developer Workflows

### Build & Watch

- `npm run build` – Build plugin (uses `strapi-plugin build`)
- `npm run watch` – Watch mode for development
- `npm run watch:link` – Link plugin to local Strapi installation

### Type Checking

- `npm run test:ts:front` – Check admin TypeScript (`admin/tsconfig.json`)
- `npm run test:ts:back` – Check server TypeScript (`server/tsconfig.json`)

### Common Tasks

- **Add a new API endpoint**: Define in `server/src/routes/content-api.ts`, create handler in `server/src/controllers/`, implement logic in `server/src/services/`
- **Add UI component**: Place in `admin/src/components/`, import in pages
- **Internationalization**: Add key-value pairs to `admin/src/translations/{locale}.json`, use `getTranslation()` helper

## Important Conventions

### Import/Module Resolution

- Admin uses lazy dynamic imports for pages (see `admin/src/index.ts`)
- Server uses direct imports; ensure `services`, `controllers` are indexed in respective `index.ts` files
- Plugin ID scoping: Always use `PLUGIN_ID` constant for namespacing

### TypeScript

- Admin: React 18.3, styled-components, react-intl for i18n
- Server: Core Strapi types imported from `@strapi/strapi` (e.g., `Core.Strapi`)
- Both: CommonJS output with ES module variants

### Naming Conventions

- Controllers: Single default export function
- Services: Single default export function
- Routes: Array of route objects with `method`, `path`, `handler`, `config`

## External Dependencies

- **@strapi/design-system**: UI components
- **@strapi/icons**: Icon library
- **react-intl**: i18n framework
- **styled-components**: CSS-in-JS styling
- **react-router-dom**: Routing for multi-page layouts

## No Automated Tests Found

Project has TypeScript validation only (`test:ts:*` scripts). No Jest/test suite in package.json—verify with maintainers if tests exist elsewhere or should be implemented.
