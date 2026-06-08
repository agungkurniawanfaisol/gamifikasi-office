import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

/**
 * VITE_BASE: optional override for built asset URL prefix (must end with /).
 * Leave unset so laravel-vite-plugin uses /build/ (document root = public/).
 *
 * Only set VITE_BASE when the app URL path does not match the default, e.g.
 * document root above `public/` → VITE_BASE=/public/build/ before `npm run build`.
 */
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const raw = env.VITE_BASE?.trim();
    const base = raw ? (raw.endsWith('/') ? raw : `${raw}/`) : undefined;

    return {
        ...(base ? { base } : {}),
        plugins: [
            laravel({
                input: 'resources/js/app.tsx',
                refresh: true,
            }),
            react(),
        ],
    };
});
