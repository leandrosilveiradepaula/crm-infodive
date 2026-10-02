export const PUBLIC_PATHS = new Set([
    '/login',
    '/auth/callback',
    '/api/auth/logout',
    '/api/proposals/sign',
]);

export const PUBLIC_PATTERNS = [
    /^\/proposals\/public\/[a-f0-9]{16,32}$/i,
    /^\/portal\/[a-f0-9]{32}$/i,
    /^\/api\/proposals\/public\/[a-f0-9]{16,32}$/i,
];

export function isPublicRoute(pathname: string) {
    return PUBLIC_PATHS.has(pathname) || PUBLIC_PATTERNS.some((pattern) => pattern.test(pathname));
}
