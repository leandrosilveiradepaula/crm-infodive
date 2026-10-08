import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSessionContext } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export default async function DebugPage() {
    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_INTERNAL_DEBUG_ROUTES !== 'true') notFound();
    const session = await requireSessionContext().catch(() => null);

    // Internal diagnostics must never dump tenant/user identifiers or customer rows.
    let accountCount: number | null = null;
    let dbErrorMessage: string | null = null;
    if (session) {
        const { count, error } = await createAdminClient()
            .from('accounts')
            .select('id', { head: true, count: 'exact' })
            .eq('organization_id', session.organizationId);
        accountCount = count;
        dbErrorMessage = error?.message ?? null;
    } else {
        dbErrorMessage = 'No session to query DB';
    }

    return (
        <div className="p-10 bg-black min-h-screen text-white font-mono space-y-6">
            <h1 className="text-3xl font-bold bg-primary p-4 rounded text-white mb-6">
                System Debugger
            </h1>

            {/* Style Test */}
            <div className="border border-white/20 p-4 rounded">
                <h2 className="text-xl font-bold text-green-400 mb-2">1. Visual Test</h2>
                <div className="flex gap-4">
                    <div className="w-16 h-16 bg-primary flex items-center justify-center text-xs">Tw Blue</div>
                    <div className="w-16 h-16 bg-primary flex items-center justify-center text-xs">IBM Blue</div>
                    <div className="w-16 h-16 bg-[#0f62fe] flex items-center justify-center text-xs">Hex Blue</div>
                    <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-xs">Rounded</div>
                </div>
                <p className="mt-2 text-muted-foreground">If chunks are colored, Tailwind is working.</p>
            </div>

            {/* Auth Test */}
            <div className="border border-white/20 p-4 rounded">
                <h2 className="text-xl font-bold text-yellow-400 mb-2">2. Authentication (Iron Session)</h2>
                {!session ? (
                    <div className="text-red-400">No active Iron Session found.</div>
                ) : (
                    <div className="text-green-400">
                        Status: Logged In (Iron Session)
                    </div>
                )}
            </div>

            {/* DB Test */}
            <div className="border border-white/20 p-4 rounded">
                <h2 className="text-xl font-bold text-teal-400 mb-2">3. Database Connection</h2>

                <h3 className="font-bold mt-2">Accounts Table (Tenant-Scoped Count):</h3>
                {dbErrorMessage ? (
                    <div className="text-red-400">Database diagnostic failed.</div>
                ) : (
                    <div className="text-green-400">
                        Tenant-scoped query succeeded. Rows visible: {accountCount ?? 0}.
                    </div>
                )}
            </div>
        </div>
    );
}
