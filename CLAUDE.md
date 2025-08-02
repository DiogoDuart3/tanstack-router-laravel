# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Laravel Backend
- `composer dev` - Start development server with queue worker, logs, and Vite in parallel
- `composer dev:ssr` - Development with server-side rendering enabled
- `composer test` - Run PHP tests (clears config first)
- `php artisan test` - Run Pest tests directly
- `php artisan pail` - View application logs in real-time
- `php artisan serve` - Start Laravel development server only
- `php artisan queue:listen --tries=1` - Run queue worker

### Frontend (React/TypeScript)
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run build:ssr` - Build with SSR support
- `npm run lint` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run types` - Type check TypeScript files

### Testing
- `composer test` - Run all PHP tests using Pest
- `php artisan test --filter=FeatureName` - Run specific test group
- Tests are organized in `tests/Feature/` and `tests/Unit/`

## Architecture Overview

This is a Laravel + React application using Inertia.js as the bridge between backend and frontend.

### Backend Structure
- **Laravel 12** with PHP 8.2+
- **Inertia.js** for SPA-like experience without API
- **Pest** for testing framework
- **SQLite** database (database.sqlite)
- Authentication system with email verification
- Queue system for background jobs

### Frontend Structure
- **React 19** with TypeScript
- **Inertia.js React adapter** for page components
- **Tailwind CSS v4** with custom configuration
- **Radix UI** components for accessible UI primitives
- **Vite** for build tooling with Laravel integration
- **ESLint + Prettier** for code quality

### Key Directories
- `app/Http/Controllers/` - Laravel controllers
- `resources/js/` - React components, pages, and TypeScript code
- `resources/js/pages/` - Inertia page components
- `resources/js/components/` - Reusable React components
- `resources/js/layouts/` - Layout components
- `routes/` - Laravel route definitions
- `tests/` - Pest test files

### Important Files
- `vite.config.ts` - Vite configuration with Laravel plugin
- `composer.json` - Defines useful development scripts
- `package.json` - Frontend dependencies and scripts
- `phpunit.xml` - Test configuration
- `tests/Pest.php` - Pest test configuration

### Development Workflow
1. Use `composer dev` to start all services simultaneously
2. Laravel serves API/SSR on one port, Vite serves assets on another
3. Inertia.js handles client-side navigation
4. Tests use Pest framework with SQLite in-memory database
5. Code formatting handled by Prettier, linting by ESLint

### Imported App
There's an `imported_app/` directory containing what appears to be a separate React application with TanStack Router. This seems to be imported from another project and may be intended for integration.