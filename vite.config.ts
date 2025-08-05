import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
// import react from '@vitejs/plugin-react-swc';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        host: 'localhost',
        hmr: {
            host: 'localhost',
        },
    },
    plugins: [
        // react(), // Removed - Laravel handles React compilation
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
        }),
        tailwindcss(),
        tanstackRouter({
            routesDirectory: './resources/js/routes',
            generatedRouteTree: './resources/js/routeTree.gen.ts',
        }),
        VitePWA({
            registerType: 'autoUpdate',
            manifest: {
                name: 'Laravel TanStack Router App',
                short_name: 'Laravel App',
                description: 'Laravel TanStack Router PWA Application',
                theme_color: '#0c0c0c',
            },
            pwaAssets: { disabled: false, config: true },
            devOptions: { enabled: true },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
                runtimeCaching: [
                    {
                        urlPattern: /^\/api\//,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'api-cache',
                            networkTimeoutSeconds: 3,
                        },
                    },
                ],
            },
        }),
    ],

    resolve: {
        alias: {
            '@': resolve(__dirname, './resources/js'),
        },
    },
});
