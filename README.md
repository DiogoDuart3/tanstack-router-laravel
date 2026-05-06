# Laravel TanStack Router Starter Kit

<div align="center">

**A modern, full-stack TypeScript starter kit that combines the best technologies for building scalable web applications with type safety, performance, and developer experience.**

![Laravel](https://img.shields.io/badge/Laravel-12.0-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)
![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![TanStack Router](https://img.shields.io/badge/TanStack%20Router-1.114-FF4154?style=for-the-badge&logo=react-router&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

[🚀 Demo](https://tan.diogodev.com) • [🎯 Features](#-features) • [⚡ Quick Start](#-quick-start) • [🛠️ Tech Stack](#️-technology-stack)

</div>

---

## ✨ Why Choose This Stack?

Built with modern best practices and developer experience in mind.

### 🛡️ **Type Safety**
End-to-end type safety from database to UI with TypeScript, TanStack Router, and Laravel's strong typing.

### ⚡ **Performance** 
Built on Laravel's proven API architecture with React 19's concurrent features and TanStack Query for optimal performance.

### 📱 **PWA Ready**
Progressive Web App support with offline capabilities and native app-like experience.

### 🎯 **Developer Experience**
Hot reload, type checking, file-based routing, and modern tooling for the best development experience.

---

## 🚀 Features

### **Frontend Excellence**
- ⚛️ **React 19** - Latest React with concurrent features and improved performance
- 🛣️ **TanStack Router** - Type-safe file-based routing with full TypeScript support
- 🔄 **TanStack Query** - Powerful server state management and data synchronization
- 📘 **TypeScript 5.7** - Complete type safety across your entire application
- 🎨 **Tailwind CSS v4** - Utility-first CSS framework with modern features
- 🧩 **Radix UI** - Accessible, unstyled UI primitives for beautiful components

### **Backend Power**
- 🚀 **Laravel 12** - Modern PHP framework with latest features and performance improvements
- 🔗 **Laravel Sanctum** - Simple, powerful API authentication system
- ⚡ **Laravel Reverb** - Real-time WebSocket server for live features
- 🗃️ **SQLite** - Lightweight, fast database perfect for development and small applications
- 🏗️ **RESTful API** - Clean API architecture with full type safety

### **Real-time Features**
- 💬 **Live Chat System** - Real-time messaging with typing indicators
- 👨‍💼 **Admin Chat Panel** - Dedicated admin communication channel
- 🔄 **WebSocket Integration** - Seamless real-time updates across the application
- 📡 **Live Notifications** - Instant updates for better user experience

### **Developer Tools**
- 🧪 **Pest PHP** - Modern, elegant testing framework for PHP
- ⚡ **Vite 7** - Lightning-fast build tool with HMR
- 🔍 **ESLint 9** - Code quality and consistency enforcement
- 💅 **Prettier 3** - Automatic code formatting
- 🎨 **Laravel Pint** - PHP code style fixer
- 📦 **Concurrently** - Run multiple development servers simultaneously

### **UI & UX**
- 🌓 **Dark/Light Theme** - Automatic theme switching with system preference detection
- 📱 **PWA Support** - Install as native app with offline capabilities
- ♿ **Accessibility First** - Built with Radix UI for maximum accessibility
- 📐 **Responsive Design** - Mobile-first approach that works on all devices
- 🎭 **Beautiful Animations** - Smooth transitions and micro-interactions

### **Authentication & Security**
- 🔐 **Complete Auth System** - Registration, login, password reset, email verification
- 👤 **User Profiles** - Comprehensive user management
- 🛡️ **Role-based Access** - Admin and user role management
- 🔒 **Protected Routes** - Secure route protection and middleware
- 📧 **Email Verification** - Secure account verification process

## 🛠️ Technology Stack

<table>
<tr>
<td width="50%">

### 🎨 **Frontend**
| Technology | Version | Purpose |
|------------|---------|---------|
| [React](https://react.dev/) | 19.0 | UI Library with concurrent features |
| [TypeScript](https://www.typescriptlang.org/) | 5.7 | Type-safe JavaScript |
| [TanStack Router](https://tanstack.com/router) | 1.114 | File-based routing with type safety |
| [TanStack Query](https://tanstack.com/query) | Latest | Server state management |
| [Tailwind CSS](https://tailwindcss.com/) | 4.0 | Utility-first CSS framework |
| [Radix UI](https://www.radix-ui.com/) | Latest | Accessible component primitives |
| [Lucide React](https://lucide.dev/) | Latest | Beautiful icon library |

### 🔧 **Development Tools**
| Tool | Purpose |
|------|---------|
| [Vite](https://vitejs.dev/) | Lightning-fast build tool |
| [ESLint](https://eslint.org/) | Code quality enforcement |
| [Prettier](https://prettier.io/) | Code formatting |
| [TypeScript](https://www.typescriptlang.org/) | Static type checking |

</td>
<td width="50%">

### ⚙️ **Backend**
| Technology | Version | Purpose |
|------------|---------|---------|
| [Laravel](https://laravel.com/) | 12.0 | Modern PHP framework |
| [Laravel Sanctum](https://laravel.com/docs/sanctum) | Latest | API authentication |
| [Laravel Reverb](https://reverb.laravel.com/) | Latest | Real-time WebSocket server |
| [Pest PHP](https://pestphp.com/) | Latest | Modern testing framework |
| [SQLite](https://www.sqlite.org/) | Latest | Lightweight database |

### 📱 **UI Components**
| Package | Purpose |
|---------|---------|
| React Hook Form | Performant forms |
| Zod | Schema validation |
| Date-fns | Date utilities |
| Sonner | Toast notifications |
| Next Themes | Theme management |
| CVA | Component variants |

</td>
</tr>
</table>

## 📁 Project Structure

```
├── app/                    # Laravel application
│   ├── Http/Controllers/   # API controllers
│   │   ├── Api/           # Frontend API endpoints
│   │   └── Auth/          # Authentication controllers
│   ├── Models/            # Eloquent models
│   └── Policies/          # Authorization policies
├── resources/js/          # React frontend
│   ├── components/        # Reusable components
│   ├── routes/           # TanStack Router file-based routes
│   ├── layouts/          # Layout components
│   ├── hooks/            # Custom React hooks
│   └── lib/              # Utilities and API client
├── routes/               # Laravel routes
│   ├── api.php           # API routes
│   └── web.php           # SPA catch-all route
├── tests/               # Pest tests
└── database/            # Migrations and seeders
```

## ⚡ Quick Start

### 📋 Prerequisites

Before you begin, ensure you have the following installed:

| Requirement | Version | Installation |
|-------------|---------|--------------|
| **PHP** | 8.2+ | [Download PHP](https://www.php.net/downloads) |
| **Node.js** | 18+ | [Download Node.js](https://nodejs.org/) |
| **Composer** | Latest | [Install Composer](https://getcomposer.org/download/) |
| **SQLite** | Latest | Usually included with PHP |

### 🚀 Installation

#### **1. Clone & Navigate**
```bash
git clone https://github.com/DiogoDuart3/tanstack-router-laravel.git
cd tanstack-router-laravel
```

#### **2. Install Dependencies**
```bash
# Install PHP dependencies
composer install

# Install Node.js dependencies  
npm install
```

#### **3. Environment Configuration**
```bash
# Copy environment configuration
cp .env.example .env

# Generate Laravel application key
php artisan key:generate

# Create SQLite database file
touch database/database.sqlite

# Run database migrations and seeders
php artisan migrate --seed
```

#### **4. Start Development Server**

**🎯 One Command (Recommended):**
```bash
composer dev
```
This starts Laravel server, Vite dev server, queue worker, and log monitoring simultaneously.

**🔧 Individual Services:**
```bash
# Terminal 1 - Laravel Backend
php artisan serve

# Terminal 2 - Vite Frontend  
npm run dev

# Terminal 3 - Queue Worker (for real-time features)
php artisan queue:listen --tries=1

# Terminal 4 - Log Monitoring (optional)
php artisan pail
```

#### **5. 🎉 Access Your Application**

| Service | URL | Purpose |
|---------|-----|---------|
| **Main App** | http://localhost:8000 | Full application |
| **Vite Dev Server** | http://localhost:5173 | Frontend assets |
| **API Health Check** | http://localhost:8000/api/health | Backend status |

### 🔧 Additional Setup (Optional)

#### **Real-time Features Setup**
For WebSocket functionality (chat, live updates):
```bash
# Start Laravel Reverb WebSocket server
php artisan reverb:start

# Or use the included development command
composer dev:ssr
```

#### **Admin User Creation**
```bash
# Create an admin user via tinker
php artisan tinker

# In tinker console:
User::factory()->create([
    'email' => 'admin@example.com',
    'is_admin' => true
]);
```

## 🧪 Testing & Quality Assurance

### **Running Tests**
```bash
# 🧪 Run all PHP tests with Pest
composer test

# 🎯 Run specific test suite  
php artisan test --filter=ChatTest

# 📊 Run tests with coverage
php artisan test --coverage

# 🔍 TypeScript type checking
npm run types

# 🎨 Code linting and formatting
npm run lint      # ESLint with auto-fix
npm run format    # Prettier formatting
```

### **Test Structure**
```
tests/
├── Feature/          # Integration tests
│   ├── AuthTest.php
│   ├── ChatTest.php
│   └── TodoTest.php
├── Unit/            # Unit tests
└── Pest.php        # Pest configuration
```

---

## 📱 Progressive Web App (PWA)

### **PWA Features**
- 🔄 **Offline Support** - Service workers cache assets and API responses
- 📲 **Install Prompts** - Native install experience on mobile and desktop
- 🔁 **Background Sync** - Queue operations when offline, sync when online
- 📬 **Push Notifications** - Real-time notifications (configurable)
- 🎯 **App-like UX** - Native mobile app experience in browser
- ⚡ **Fast Loading** - Optimized caching strategies for instant loading

### **PWA Installation**
Visit `/install-pwa` or use the install prompt that appears automatically on supported devices.

---

## 📋 Available Scripts

<table>
<tr>
<td width="50%">

### **🐘 Backend (Laravel)**
```bash
# Development
composer dev         # All services
composer dev:ssr     # With SSR support
php artisan serve    # Laravel only
php artisan pail     # Live logs

# Database  
php artisan migrate  # Run migrations
php artisan db:seed  # Seed database
php artisan migrate:fresh --seed

# Testing
composer test        # Run Pest tests
php artisan test --filter=Feature

# WebSocket
php artisan reverb:start
```

</td>
<td width="50%">

### **⚛️ Frontend (React)**
```bash
# Development
npm run dev          # Vite dev server
npm run build        # Production build
npm run build:ssr    # SSR build
npm run preview      # Preview build

# Code Quality
npm run lint         # ESLint
npm run format       # Prettier
npm run types        # TypeScript check
npm run format:check # Check formatting

# PWA
npm run build:pwa    # Build with PWA
```

</td>
</tr>
</table>

---

## 🚀 Production Deployment

### **📦 Build Process**
```bash
# 1. Install production dependencies
composer install --no-dev --optimize-autoloader
npm ci --production

# 2. Build frontend assets
npm run build

# 3. Optimize Laravel
php artisan config:cache
php artisan route:cache  
php artisan view:cache
php artisan storage:link

# 4. Set production environment
export APP_ENV=production
export APP_DEBUG=false
```

### **🌐 Deployment Platforms**

| Platform | Configuration | Notes |
|----------|---------------|-------|
| **Laravel Forge** | Zero-config | Automatic deployments |
| **Vercel** | `vercel.json` | Serverless functions |
| **DigitalOcean** | Docker | App Platform ready |
| **AWS** | Beanstalk/ECS | Scalable infrastructure |
| **Shared Hosting** | Upload files | Traditional hosting |

---

## 🎯 Key Architectural Decisions

### **Why TanStack Router?**
- 🛡️ **Type Safety** - Full TypeScript integration with route parameters
- 📁 **File-based** - Intuitive routing structure
- 🔗 **Code Splitting** - Automatic route-based code splitting
- 🎣 **Data Loading** - Built-in loader and search param management

### **Why Laravel API Architecture?**
- 🔄 **Clean Separation** - Clear boundaries between frontend and backend
- 🛡️ **Security** - Laravel Sanctum for secure API authentication
- 📦 **Scalability** - Easy to scale frontend and backend independently
- 🎯 **Flexibility** - API can serve multiple clients (web, mobile, etc.)

### **Why Laravel Reverb?**
- ⚡ **Native Integration** - Built specifically for Laravel
- 🔧 **Easy Setup** - No external WebSocket services needed  
- 📊 **Monitoring** - Built-in connection monitoring
- 🔒 **Secure** - Automatic authentication integration

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### **🔧 Development Setup**
```bash
# 1. Fork and clone the repository
git clone https://github.com/DiogoDuart3/tanstack-router-laravel.git

# 2. Create a feature branch
git checkout -b feature/amazing-feature

# 3. Make your changes and test
composer test
npm run lint

# 4. Commit with conventional commits
git commit -m "feat: add amazing feature"

# 5. Push and create PR
git push origin feature/amazing-feature
```

### **📝 Contribution Guidelines**
- Use [Conventional Commits](https://conventionalcommits.org/)
- Add tests for new features
- Update documentation as needed
- Follow existing code style (ESLint/Prettier/Pint)

---

## 📄 License & Credits

### **📜 License**
This project is open-sourced software licensed under the [MIT License](https://opensource.org/licenses/MIT).

### **🙏 Built With**
Special thanks to the teams behind:
- [Laravel](https://laravel.com/) - The PHP framework for web artisans
- [React](https://react.dev/) - A JavaScript library for building user interfaces  
- [TanStack](https://tanstack.com/) - Headless, type-safe, powerful utilities
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/) - Low-level UI primitives

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

[🐛 Report Bug](https://github.com/DiogoDuart3/tanstack-router-laravel/issues) • 
[✨ Request Feature](https://github.com/DiogoDuart3/tanstack-router-laravel/issues)

**Made with ❤️ for the Laravel and React community**

</div>