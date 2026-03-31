import { createAdminClient } from '@/lib/supabase/admin';
import { requireSessionContext } from '@/lib/auth-server';

export default async function DebugPage() {
    const session = await requireSessionContext().catch(() => null);
    const supabase = createAdminClient();

    // 1. Check Auth (Now using session)
    const user = session ? { id: session.userId, organization_id: session.organizationId } : null;

    // 2. Check DB Connection (Account)
    const { data: accounts, error: dbError } = session 
        ? await supabase.from('accounts').select('*').eq('organization_id', session.organizationId).limit(5)
        : { data: null, error: { message: 'No session to query DB' } as any };

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
                        Status: Logged In (Iron Session) <br />
                        User ID: {session.userId} <br />
                        Org ID: {session.organizationId}
                    </div>
                )}
            </div>

            {/* DB Test */}
            <div className="border border-white/20 p-4 rounded">
                <h2 className="text-xl font-bold text-teal-400 mb-2">3. Database Connection</h2>

                <h3 className="font-bold mt-2">Accounts Table (Organization Filtered):</h3>
                {dbError ? (
                    <div className="text-red-400">Error: {dbError.message}</div>
                ) : (
                    <div className="text-green-400">
                        Found {accounts?.length} rows for organization {session?.organizationId}. <br />
                        <pre className="text-xs bg-gray-900 p-2 mt-2 border border-gray-700 overflow-auto">
                            {JSON.stringify(accounts, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}
