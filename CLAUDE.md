# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Laravel Backend
- `composer dev` - Start development server with queue worker, logs, and Vite in parallel
- `composer test` - Run PHP tests (clears config first)
- `php artisan test` - Run Pest tests directly
- `php artisan test --filter=FeatureName` - Run specific test group
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
- Tests are organized in `tests/Feature/` and `tests/Unit/`

## Architecture Overview

This is a Laravel + React application using **TanStack Router** for client-side routing and Laravel as an API backend.

### Backend Structure
- **Laravel 12** with PHP 8.2+
- **Laravel Sanctum** for API authentication
- **Laravel Reverb** for WebSocket/real-time features
- **Pest** for testing framework
- **SQLite** database (database.sqlite)
- Authentication system with email verification
- Queue system for background jobs
- Real-time chat system with admin panel

### Frontend Structure
- **React 19** with TypeScript
- **TanStack Router** for file-based routing with type safety
- **TanStack Query** for server state management
- **Tailwind CSS v4** with custom configuration
- **Radix UI** components for accessible UI primitives
- **Vite** for build tooling with Laravel integration
- **PWA** support with service workers
- **ESLint + Prettier** for code quality

### Key Directories
- `app/Http/Controllers/Api/` - API controllers for frontend
- `app/Http/Controllers/Auth/` - Authentication controllers
- `app/Models/` - Eloquent models (User, Todo, Chat, AdminChat)
- `resources/js/routes/` - TanStack Router route files
- `resources/js/components/` - Reusable React components
- `resources/js/layouts/` - Layout components
- `resources/js/hooks/` - Custom React hooks
- `resources/js/lib/` - Utility functions and API client
- `routes/api.php` - API routes
- `routes/web.php` - Catches all routes and serves React SPA
- `tests/` - Pest test files

### Important Files
- `vite.config.ts` - Vite configuration with Laravel plugin, TanStack Router, and PWA
- `resources/js/routeTree.gen.ts` - Auto-generated TanStack Router route tree
- `resources/js/app.tsx` - Main React application entry point
- `composer.json` - Defines useful development scripts
- `package.json` - Frontend dependencies and scripts
- `phpunit.xml` - Test configuration
- `tests/Pest.php` - Pest test configuration

### Development Workflow
1. Use `composer dev` to start all services simultaneously (Laravel, Vite, queue worker, logs)
2. Laravel serves as API backend on port 8000
3. Vite serves frontend assets with HMR
4. TanStack Router handles client-side navigation with type safety
5. TanStack Query manages server state and caching
6. Tests use Pest framework with SQLite in-memory database
7. Code formatting handled by Prettier, linting by ESLint

### Key Features
- **Real-time Chat**: WebSocket-based chat system with typing indicators
- **Admin Panel**: Dedicated admin chat interface
- **PWA Support**: Installable as native app with offline capabilities
- **Todo System**: CRUD operations with image uploads
- **Authentication**: Complete auth flow with email verification
- **Theme System**: Dark/light mode with system preference detection