export function useAuth() {
    return {
        profile: { full_name: 'Ana Martins', role: 'manager', avatar_url: '' },
        signOut: async () => undefined,
    };
}
