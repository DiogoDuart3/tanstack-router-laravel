import { authApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Bell, Menu, MessageCircle, Shield, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ModeToggle } from './mode-toggle';
import { Button } from './ui/button';
import UserMenu from './user-menu';

export default function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Check if user is authenticated
    const userQuery = useQuery({
        queryKey: ['auth', 'user'],
        queryFn: authApi.getUser,
        retry: false,
    });

    const isAuthenticated = !!localStorage.getItem('auth_token') && !userQuery.error;
    const isAdmin = userQuery.data?.user?.is_admin;

    // Debug logging (remove this later)
    console.log('Header Debug:', {
        hasToken: !!localStorage.getItem('auth_token'),
        userQueryError: userQuery.error,
        userData: userQuery.data,
        isAuthenticated,
        isAdmin,
    });

    const publicLinks = [
        { to: '/', label: 'Home' },
        { to: '/chat', label: 'Chat', icon: MessageCircle },
        { to: '/notifications', label: 'Notifications', icon: Bell },
        { to: '/health', label: 'Health' },
        { to: '/install-pwa', label: 'Install App' },
    ];

    const authenticatedLinks = [
        { to: '/', label: 'Home' },
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/todos', label: 'Todos' },
        { to: '/chat', label: 'Chat', icon: MessageCircle },
        ...(isAdmin ? [{ to: '/admin-chat', label: 'Admin Chat', icon: Shield }] : []),
        { to: '/notifications', label: 'Notifications', icon: Bell },
        { to: '/profile', label: 'Profile' },
        { to: '/health', label: 'Health' },
        { to: '/install-pwa', label: 'Install App' },
    ];

    const links = isAuthenticated ? authenticatedLinks : publicLinks;

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    // Close mobile menu on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeMobileMenu();
            }
        };

        if (isMobileMenuOpen) {
            document.addEventListener('keydown', handleEscape);
            // Prevent body scroll when menu is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isMobileMenuOpen]);

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                {/* Logo/Brand */}
                <div className="flex items-center">
                    <Link to="/" className="flex items-center space-x-2 text-xl font-bold text-primary transition-colors hover:text-primary/80">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                            <span className="text-sm font-bold text-primary-foreground">A</span>
                        </div>
                        <span className="hidden sm:inline-block">App</span>
                        {import.meta.env.DEV && (
                            <span className="ml-2 rounded-md bg-orange-500 px-1.5 py-0.5 text-xs font-medium text-white">DEV</span>
                        )}
                    </Link>
                </div>

                {/* Desktop Navigation - Hidden on tablet, shown on desktop */}
                <nav className="hidden items-center space-x-1 lg:flex">
                    {links.map(({ to, label, icon: Icon }) => {
                        return (
                            <Link
                                key={to}
                                to={to}
                                className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground"
                            >
                                {Icon && <Icon className="h-4 w-4" />}
                                <span>{label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Desktop Right Side */}
                <div className="flex items-center space-x-2">
                    <ModeToggle />
                    <UserMenu />

                    {/* Mobile/Tablet Menu Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="p-2 lg:hidden"
                        onClick={toggleMobileMenu}
                        aria-label="Toggle mobile menu"
                        aria-expanded={isMobileMenuOpen}
                    >
                        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                </div>
            </div>

            {/* Mobile/Tablet Navigation Menu */}
            {isMobileMenuOpen && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden" onClick={closeMobileMenu} />

                    {/* Menu */}
                    <div className="absolute top-full right-0 left-0 z-50 max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-border bg-background shadow-lg lg:hidden">
                        <nav className="flex flex-col py-2">
                            {links.map(({ to, label, icon: Icon }) => {
                                return (
                                    <Link
                                        key={to}
                                        to={to}
                                        className="flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-accent"
                                        onClick={closeMobileMenu}
                                    >
                                        {Icon && <Icon className="h-4 w-4" />}
                                        <span>{label}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </>
            )}
        </header>
    );
}
