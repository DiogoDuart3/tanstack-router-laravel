import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
// import react from '@vitejs/plugin-react-swc';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

// Get git commit hash and build timestamp
const getGitCommitHash = () => {
    try {
        return execSync('git rev-parse HEAD').toString().trim();
    } catch {
        return 'dev';
    }
};

const buildTimestamp = Date.now();
const commitHash = getGitCommitHash();

// Plugin to generate build info file
const buildInfoPlugin = () => ({
    name: 'build-info',
    buildStart() {
        // Write build info to public directory
        const buildInfo = {
            version: commitHash,
            timestamp: buildTimestamp,
            built_at: new Date(buildTimestamp).toISOString(),
        };

        try {
            writeFileSync('public/build.json', JSON.stringify(buildInfo, null, 2));
            console.log('✓ Generated build.json with version:', commitHash.substring(0, 8));
        } catch (error) {
            console.warn('Failed to write build.json:', error);
        }
    },
});

export default defineConfig({
    server: {
        host: '0.0.0.0',
        port: 5173,
        hmr: {
            host: 'localhost',
        },
    },
    define: {
        __APP_VERSION__: JSON.stringify(commitHash),
        __BUILD_TIMESTAMP__: JSON.stringify(buildTimestamp),
    },
    plugins: [
        buildInfoPlugin(),
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
            strategies: 'injectManifest',
            srcDir: 'resources/js',
            filename: 'sw.ts',
            scope: '/',
            outDir: 'public',
            injectManifest: {
                swSrc: 'resources/js/sw.ts',
                swDest: 'public/sw.js',
                globPatterns: ['**/*.{js,css,html,png,svg}'],
                globIgnores: ['**/favicon.ico'],
            },
            manifest: {
                name: 'Laravel TanStack Router App',
                short_name: 'Laravel App',
                description: 'Laravel TanStack Router PWA Application',
                theme_color: '#0c0c0c',
                background_color: '#0c0c0c',
                display: 'standalone',
                start_url: '/',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    },
                    {
                        src: 'maskable-icon-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable'
                    }
                ]
            },
            pwaAssets: { disabled: false, config: true },
            devOptions: { enabled: true },
        }),
    ],

    resolve: {
        alias: {
            '@': resolve(__dirname, './resources/js'),
        },
    },
});
