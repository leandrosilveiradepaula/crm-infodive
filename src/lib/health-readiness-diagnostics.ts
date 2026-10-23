/**
 * Server-only operational diagnostics for health checks.
 * This function never serializes provider error text or arbitrary status codes.
 * It is not an authorization mechanism and grants no database access.
 */
export type ReadinessFailureReason =
    | 'db_credential_rejected'
    | 'db_access_denied'
    | 'db_schema_unavailable'
    | 'db_transport_unavailable'
    | 'db_query_failed';

export function classifyReadinessFailure(
    error: unknown,
    httpStatus?: unknown,
): ReadinessFailureReason {
    const code = error && typeof error === 'object' && 'code' in error &&
        typeof error.code === 'string' ? error.code : undefined;

    // Prioritize typed provider codes over broad HTTP statuses.
    if (code === 'PGRST301' || code === 'PGRST302' || code === '28P01') {
        return 'db_credential_rejected';
    }
    if (code === '42501' || code === 'PGRST100') {
        return 'db_access_denied';
    }
    if (code === 'PGRST205' || code === 'PGRST204' || code === '42P01' || code === '42703') {
        return 'db_schema_unavailable';
    }
    if (code === 'PGRST000' || code === 'PGRST002' || code === '08006' ||
        code === '08001' || code === '57P03' || code === '53300' || code === '57014') {
        return 'db_transport_unavailable';
    }
    if (httpStatus === 401) return 'db_credential_rejected';
    if (httpStatus === 403) return 'db_access_denied';
    if (typeof httpStatus === 'number' && httpStatus >= 500) return 'db_transport_unavailable';
    if (error instanceof TypeError) return 'db_transport_unavailable';
    return 'db_query_failed';
}
