import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://ANGELUSD11.github.io',
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
    server: {
      watch: {
        // Tu sistema tiene fs.inotify.max_user_instances=128 y ya está saturado
        // por VS Code/Discord, lo que hace que el watcher de Vite falle con EMFILE.
        // Polling no usa inotify, así que esquiva el límite. Si subís el límite
        // (sudo sysctl fs.inotify.max_user_instances=1024) podés borrar este bloque
        // para recuperar el watcher nativo (sin costo de CPU).
        usePolling: true,
        interval: 300,
        ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**']
      }
    }
  }
});