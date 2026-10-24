/** Active states for top-level routes and their nested pages. */
export function isSidebarNavActive(pathname: string | null, href: string): boolean {
    if (!pathname || !href.startsWith('/') || href === '/') return false;
    return pathname === href || pathname.startsWith(`${href}/`);
}
