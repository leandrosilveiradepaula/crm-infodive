import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const projectRoot = resolve(__dirname, '../..');

export default defineConfig({
    root: projectRoot,
    resolve: {
        alias: [
            { find: '@/hooks/useAuth', replacement: resolve(__dirname, 'stubs/useAuth.ts') },
            { find: '@/components/providers/ThemeProvider', replacement: resolve(__dirname, 'stubs/themeProvider.tsx') },
            { find: '@/components/ai/AiAssistant', replacement: resolve(__dirname, 'stubs/aiAssistant.tsx') },
            { find: 'next/link', replacement: resolve(__dirname, 'stubs/link.tsx') },
            { find: 'next/navigation', replacement: resolve(__dirname, 'stubs/navigation.ts') },
            { find: '@', replacement: resolve(projectRoot, 'src') },
        ],
    },
    css: { postcss: resolve(projectRoot, 'postcss.config.mjs') },
    server: { fs: { strict: false } },
});
