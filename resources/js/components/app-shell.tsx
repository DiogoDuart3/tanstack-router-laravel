
import { SidebarProvider } from '@/components/ui/sidebar';
// import { SharedData } from '@/types'; // No longer needed with TanStack Router
// Note: This component needs to be refactored to get sidebar state from TanStack Router context or another state management solution
// import { usePage } from '@inertiajs/react';

interface AppShellProps {
    children: React.ReactNode;
    variant?: 'header' | 'sidebar';
}

export function AppShell({ children, variant = 'header' }: AppShellProps) {
    // TODO: Replace with proper sidebar state management
    const isOpen = false; // Default value - needs to be replaced with actual sidebar state

    if (variant === 'header') {
        return <div className="flex min-h-screen w-full flex-col">{children}</div>;
    }

    return <SidebarProvider defaultOpen={isOpen}>{children}</SidebarProvider>;
}
