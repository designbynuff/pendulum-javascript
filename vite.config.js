import { defineConfig } from 'vite';

export default defineConfig({
    base: '/pendulum-javascript/',
    build: {
        outDir: 'docs',
        emptyOutDir: true,
    },
});
