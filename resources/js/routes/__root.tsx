import Header from '@/components/header';
import { OfflineIndicator } from '@/components/offline-indicator';
import { ThemeProvider } from '@/components/theme-provider';
import { UpdateNotification } from '@/components/UpdateNotification';
import { Toaster } from '@/components/ui/sonner';
import type { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HeadContent, Outlet, createRootRouteWithContext, useRouterState } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

export interface RouterAppContext {
    queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
    component: RootComponent,
    head: () => ({
        meta: [
            {
                title: 'Laravel TanStack Router App',
            },
            {
                name: 'description',
                content: 'Laravel TanStack Router PWA Application',
            },
        ],
        links: [
            {
                rel: 'icon',
                href: '/favicon.ico',
            },
        ],
    }),
});

function RootComponent() {
    const isFetching = useRouterState({
        select: (s) => s.isLoading,
    });

    return (
        <>
            <HeadContent />
            <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
                <OfflineIndicator />
                <UpdateNotification />
                <div className="grid h-svh grid-rows-[auto_1fr]">
                    <Header />
                    {isFetching ? (
                        <div className="flex h-full items-center justify-center pt-8">
                            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-current"></div>
                        </div>
                    ) : (
                        <Outlet />
                    )}
                </div>
                <Toaster richColors />
            </ThemeProvider>
            <TanStackRouterDevtools position="bottom-left" />
            <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
        </>
    );
}
