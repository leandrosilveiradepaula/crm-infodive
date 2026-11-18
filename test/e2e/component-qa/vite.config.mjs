import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const fixture = fileURLToPath(new URL('.', import.meta.url));
const repository = path.resolve(fixture, '../../..');

export default defineConfig({
    root: fixture,
    resolve: {
        alias: [
            {
                find: '@/app/(dashboard)/activities/actions',
                replacement: path.join(fixture, 'stub-activities-actions.ts'),
            },
            { find: /^@\//, replacement: path.join(repository, 'src') + '/' },
        ],
    },
    server: {
        host: '127.0.0.1',
        port: 4178,
        strictPort: true,
        fs: { allow: [repository] },
    },
});
