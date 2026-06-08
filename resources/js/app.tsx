import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

/** Eager: all pages ship with initial JS — no per-page `/build/assets/*.js` fetches (avoids 404 on partial deploys / shared hosting). */
const pages = import.meta.glob('./Pages/**/*.tsx', { eager: true }) as Record<
    string,
    Parameters<typeof resolvePageComponent>[1][string]
>;

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(`./Pages/${name}.tsx`, pages),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});
