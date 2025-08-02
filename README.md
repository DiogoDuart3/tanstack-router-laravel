# Laravel TanStack Router Starter Kit

A modern, full-stack web application built with **Laravel 12** and **React 19**, featuring **TanStack Router** for type-safe routing and **Inertia.js** for seamless SPA experience without the complexity of separate APIs.

![Laravel](https://img.shields.io/badge/Laravel-12.0-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)
![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![TanStack Router](https://img.shields.io/badge/TanStack%20Router-1.114-FF4154?style=for-the-badge&logo=react-router&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

## 🚀 Features

- **🔥 Modern Stack**: Laravel 12 + React 19 + TypeScript + TanStack Router
- **⚡ Type-Safe Routing**: Full TypeScript support with TanStack Router
- **🎨 Modern UI**: Tailwind CSS 4.0 with Radix UI components
- **📱 PWA Ready**: Progressive Web App with offline support
- **🔐 Authentication**: Complete auth system with email verification
- **💬 Real-time Chat**: WebSocket-powered chat with Laravel Reverb
- **✅ Todo Management**: CRUD operations with image upload support
- **👨‍💼 Admin Panel**: Role-based access control
- **🧪 Testing Ready**: Pest PHP testing framework
- **🎯 Developer Experience**: Hot reload, TypeScript, ESLint, Prettier

## 🛠️ Tech Stack

### Backend
- **[Laravel 12](https://laravel.com/)** - Modern PHP framework
- **[Inertia.js](https://inertiajs.com/)** - Server-side routing with client-side navigation
- **[Laravel Reverb](https://reverb.laravel.com/)** - Real-time WebSocket server
- **[Laravel Sanctum](https://laravel.com/docs/sanctum)** - API authentication
- **[Pest PHP](https://pestphp.com/)** - Testing framework
- **[SQLite](https://www.sqlite.org/)** - Lightweight database

### Frontend
- **[React 19](https://react.dev/)** - Latest React with concurrent features
- **[TypeScript 5.7](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[TanStack Router](https://tanstack.com/router)** - Type-safe routing
- **[TanStack Query](https://tanstack.com/query)** - Server state management
- **[Tailwind CSS 4.0](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Radix UI](https://www.radix-ui.com/)** - Accessible component primitives
- **[Lucide React](https://lucide.dev/)** - Beautiful icons

### Development Tools
- **[Vite 7](https://vitejs.dev/)** - Fast build tool
- **[ESLint 9](https://eslint.org/)** - Code linting
- **[Prettier 3](https://prettier.io/)** - Code formatting
- **[Laravel Pint](https://laravel.com/docs/pint)** - PHP code style fixer
- **[Concurrently](https://github.com/open-cli-tools/concurrently)** - Run multiple commands

### UI Components
- **React Hook Form** - Performant forms with validation
- **Zod** - Schema validation
- **Date-fns** - Date utility library
- **Sonner** - Toast notifications
- **Next Themes** - Theme management
- **Class Variance Authority** - Component variants

## 📁 Project Structure

```
├── app/                    # Laravel application
│   ├── Http/Controllers/   # API and web controllers
│   ├── Models/            # Eloquent models
│   └── Policies/          # Authorization policies
├── resources/js/          # React frontend
│   ├── components/        # Reusable components
│   ├── pages/            # Inertia page components
│   ├── layouts/          # Layout components
│   ├── routes/           # TanStack Router routes
│   └── hooks/            # Custom React hooks
├── routes/               # Laravel routes
├── tests/               # Pest tests
└── database/            # Migrations and seeders
```

## 🏃‍♂️ Quick Start

### Prerequisites
- **PHP 8.2+**
- **Node.js 18+**
- **Composer**
- **SQLite**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tanstack-router-laravel
   ```

2. **Install dependencies**
   ```bash
   # Backend dependencies
   composer install
   
   # Frontend dependencies
   npm install
   ```

3. **Environment setup**
   ```bash
   # Copy environment file
   cp .env.example .env
   
   # Generate application key
   php artisan key:generate
   
   # Create SQLite database
   touch database/database.sqlite
   
   # Run migrations
   php artisan migrate
   ```

4. **Start development server**
   ```bash
   # Start all services (Laravel + Queue + Logs + Vite)
   composer dev
   ```

   **Alternative**: Start services individually
   ```bash
   # Terminal 1: Laravel server
   php artisan serve
   
   # Terminal 2: Vite development server
   npm run dev
   
   # Terminal 3: Queue worker
   php artisan queue:listen --tries=1
   ```

5. **Visit your application**
   - Main app: `http://localhost:8000`
   - Vite dev server: `http://localhost:5173`

## 🧪 Testing

```bash
# Run all PHP tests
composer test

# Run specific test
php artisan test --filter=DashboardTest

# Type check TypeScript
npm run types

# Lint and format code
npm run lint
npm run format
```

## 📱 PWA Features

This application is PWA-ready with:
- **Offline support** via service workers
- **Install prompts** for mobile and desktop
- **Background sync** for todo operations
- **Push notifications** (configurable)
- **App-like experience** on mobile devices

## 🔐 Authentication Features

- User registration with email verification
- Secure login/logout
- Password reset functionality
- Role-based access control (Admin/User)
- Protected routes and middleware

## 💬 Real-time Features

- **Live chat system** with typing indicators
- **Admin chat panel** for user support
- **WebSocket integration** with Laravel Reverb
- **Real-time notifications** and updates

## 🎨 UI Components

Built with a comprehensive design system:
- **Accessible components** via Radix UI
- **Dark/light theme** support
- **Responsive design** for all devices
- **Custom animations** with Tailwind CSS
- **Icon system** with Lucide React

## 📄 Available Scripts

### Backend (Laravel)
```bash
composer dev         # Start all development services
composer dev:ssr     # Start with SSR support
composer test        # Run PHP tests
php artisan serve    # Laravel server only
php artisan pail     # View logs in real-time
```

### Frontend (React)
```bash
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run build:ssr    # Build with SSR
npm run lint         # Lint and fix code
npm run format       # Format code with Prettier
npm run types        # TypeScript type checking
```

## 🚀 Production Deployment

1. **Build assets**
   ```bash
   npm run build
   ```

2. **Optimize Laravel**
   ```bash
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```

3. **Set production environment**
   ```bash
   APP_ENV=production
   APP_DEBUG=false
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).

---

**Keywords**: Laravel, React, TypeScript, TanStack Router, Inertia.js, PWA, Real-time Chat, Todo App, Modern Web Development, Full-stack Application, PHP, JavaScript, Tailwind CSS, Vite, WebSocket, Authentication, Testing, REST API