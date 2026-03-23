/**
 * Application configuration and API endpoints
 */

export const CONFIG = {
    API: {
        MS_GRAPH: 'https://graph.microsoft.com/v1.0',
        GEMINI: 'https://generativelanguage.googleapis.com/v1beta',
        VIACEP: 'https://viacep.com.br/ws',
    },
    DATES: {
        PROPOSAL_EXPIRATION_DAYS: 15,
    },
    DEFAULTS: {
        MARGIN: 30,
        CURRENCY: 'BRL',
    }
} as const;
