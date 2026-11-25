import { createAdminClient } from '@/lib/supabase/admin';
import { requireSessionContext } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export default async function DebugPage() {
    const session = await requireSessionContext().catch(() => null);

    // 1. Check Auth (Now using session)
    const user = session ? { id: session.userId, organization_id: session.organizationId } : null;

    // 2. Check DB Connection (Account)
    const { data: accounts, error: dbError } = session
        ? await createAdminClient().from('accounts').select('*').eq('organization_id', session.organizationId).limit(5)
        : { data: null, error: { message: 'No session to query DB' } as any };

    return (
        <div className="p-10 bg-background min-h-screen text-foreground font-mono space-y-6">
            <h1 className="text-page-title font-bold bg-primary p-4 rounded-[var(--radius-panel)] text-primary-foreground mb-6">
                System Debugger
            </h1>

            {/* Style Test */}
            <div className="border border-border bg-card p-4 rounded-[var(--radius-panel)]">
                <h2 className="text-section-title font-bold text-success-readable mb-2">1. Visual Test</h2>
                <div className="flex flex-wrap gap-4">
                    <div className="w-16 h-16 bg-primary text-primary-foreground flex items-center justify-center text-metadata-ui">Primary</div>
                    <div className="w-16 h-16 bg-success-subtle text-success-readable flex items-center justify-center text-metadata-ui">Success</div>
                    <div className="w-16 h-16 bg-info-subtle text-foreground flex items-center justify-center text-metadata-ui">Info</div>
                    <div className="w-16 h-16 bg-destructive-subtle text-destructive-readable rounded-full flex items-center justify-center text-metadata-ui">Rounded</div>
                </div>
                <p className="mt-2 text-muted-foreground">These swatches verify the shared semantic design tokens.</p>
            </div>

            {/* Auth Test */}
            <div className="border border-border bg-card p-4 rounded-[var(--radius-panel)]">
                <h2 className="text-section-title font-bold text-warning-readable mb-2">2. Authentication (Iron Session)</h2>
                {!session ? (
                    <div className="text-destructive-readable">No active Iron Session found.</div>
                ) : (
                    <div className="text-success-readable">
                        Status: Logged In (Iron Session) <br />
                        User ID: {session.userId} <br />
                        Org ID: {session.organizationId}
                    </div>
                )}
            </div>

            {/* DB Test */}
            <div className="border border-border bg-card p-4 rounded-[var(--radius-panel)]">
                <h2 className="text-section-title font-bold text-info mb-2">3. Database Connection</h2>

                <h3 className="font-bold mt-2">Accounts Table (Organization Filtered):</h3>
                {dbError ? (
                    <div className="text-destructive-readable">Error: {dbError.message}</div>
                ) : (
                    <div className="text-success-readable">
                        Found {accounts?.length} rows for organization {session?.organizationId}. <br />
                        <pre className="text-metadata-ui bg-muted p-2 mt-2 border border-border overflow-auto">
                            {JSON.stringify(accounts, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}
