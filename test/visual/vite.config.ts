import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const projectRoot = resolve(__dirname, '../..');

export default defineConfig({
    root: resolve(__dirname, 'harness'),
    resolve: {
        alias: {
            '@': resolve(projectRoot, 'src'),
            '@/hooks/useAuth': resolve(__dirname, 'stubs/useAuth.ts'),
            '@/components/providers/ThemeProvider': resolve(__dirname, 'stubs/themeProvider.tsx'),
            '@/components/ai/AiAssistant': resolve(__dirname, 'stubs/aiAssistant.tsx'),
            'next/link': resolve(__dirname, 'stubs/link.tsx'),
            'next/navigation': resolve(__dirname, 'stubs/navigation.ts'),
        },
    },
    css: { postcss: resolve(projectRoot, 'postcss.config.mjs') },
});
