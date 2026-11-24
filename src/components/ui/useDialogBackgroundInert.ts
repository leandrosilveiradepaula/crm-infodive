'use client';

import { useEffect } from 'react';

/** Prevent keyboard focus on dashboard actions hidden behind a modal portal. */
export function useDialogBackgroundInert(open: boolean) {
    useEffect(() => {
        if (!open) return;
        const shell = document.querySelector<HTMLElement>('[data-slot="crm-dashboard-shell"]');
        if (!shell) return;
        const previouslyInert = shell.inert;
        shell.inert = true;
        return () => { shell.inert = previouslyInert; };
    }, [open]);
}
