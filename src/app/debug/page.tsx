import { createAdminClient } from '@/lib/supabase/admin';
import { requireSessionContext } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export default async function DebugPage() {
    const session = await requireSessionContext().catch(() => null);

    // Query privileged diagnostics only for an authenticated session and its organization.
    const { count: accountCount, error: dbError } = session
        ? await createAdminClient()
            .from('accounts')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', session.organizationId)
        : { count: null, error: { message: 'No session available for database diagnostics' } as any };

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
                <div className={session ? 'text-green-400' : 'text-red-400'}>
                    Authentication status: {session ? 'authenticated' : 'not authenticated'}
                </div>
            </div>

            {/* DB Test */}
            <div className="border border-white/20 p-4 rounded">
                <h2 className="text-xl font-bold text-teal-400 mb-2">3. Database Connection</h2>
                {dbError ? (
                    <div className="text-red-400">Database diagnostic unavailable.</div>
                ) : (
                    <div className="text-green-400">
                        Database connection: available. <br />
                        Organization account count: {accountCount ?? 0}
                    </div>
                )}
            </div>
        </div>
    );
}
