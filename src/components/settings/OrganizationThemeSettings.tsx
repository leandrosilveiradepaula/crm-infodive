'use client';

import { CircleAlert, Monitor, Moon, Sun } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * The organization default theme is not persisted by updateOrgTheme today.
 * Do not show a "saved" confirmation for a no-op Server Action.
 * Individual theme selection remains available in the application header.
 * A persistent org-level editor requires a separate RBAC+schema approval gate.
 */
export function OrganizationThemeSettings() {
    return (
        <Card data-qa-region="organization-theme-capability">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-primary" aria-hidden="true" />
                    Aparência da organização
                </CardTitle>
                <CardDescription>
                    O modo claro e escuro já é configurável individualmente no cabeçalho do CRM.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-[var(--ds-card-gap)] sm:grid-cols-2" aria-label="Modos de aparência disponíveis">
                    <div className="rounded-[var(--radius-panel)] border border-border bg-surface-raised p-[var(--ds-card-padding-inline)]">
                        <div className="flex items-center gap-2">
                            <Sun className="h-4 w-4 text-foreground" aria-hidden="true" />
                            <p className="ds-type-body font-semibold text-foreground">Modo claro</p>
                        </div>
                        <p className="ds-type-label mt-2 text-muted-foreground">Usa os tokens semânticos definidos para superfícies claras.</p>
                    </div>
                    <div className="rounded-[var(--radius-panel)] border border-border bg-surface-subtle p-[var(--ds-card-padding-inline)]">
                        <div className="flex items-center gap-2">
                            <Moon className="h-4 w-4 text-foreground" aria-hidden="true" />
                            <p className="ds-type-body font-semibold text-foreground">Modo escuro</p>
                        </div>
                        <p className="ds-type-label mt-2 text-muted-foreground">Usa os tokens semânticos definidos para superfícies escuras.</p>
                    </div>
                </div>
                <div role="status" className="flex items-start gap-2 rounded-[var(--radius-panel)] border border-warning/30 bg-warning-subtle p-[var(--ds-card-padding-inline)]">
                    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning-readable" aria-hidden="true" />
                    <p className="ds-type-label text-warning-readable">
                        A definição de um tema padrão para todos os usuários ainda não possui persistência validada.
                        Nenhuma alteração global será simulada ou apresentada como salva.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
