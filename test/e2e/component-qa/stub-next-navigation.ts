/* Non-functional router for synthetic QA components only. */
export function useRouter() { return { refresh() {}, push() { throw new Error('QA fixture forbids navigation'); }, replace() { throw new Error('QA fixture forbids navigation'); } }; }
export function usePathname() { return '/synthetic-component-qa'; }
export function useSearchParams() { return new URLSearchParams(); }
export function redirect() { throw new Error('QA fixture forbids navigation'); }
