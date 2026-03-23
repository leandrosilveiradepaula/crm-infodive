import path from 'path';

/**
 * Resolves a public asset path to an absolute filesystem path.
 * Required because @react-pdf/renderer runs server-side and
 * cannot resolve relative paths like "/assets/logo-infodive.png".
 */
export function resolvePublicAsset(relativePath: string): string {
    // Remove leading slash if present
    const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
    return path.join(process.cwd(), 'public', cleanPath);
}

// Pre-resolved common asset paths
export const PDF_ASSETS = {
    logo: resolvePublicAsset('assets/logo-infodive.png'),
    datacenterImage: resolvePublicAsset('assets/datacenter-corridor.jpg'),
    handshakeImage: resolvePublicAsset('assets/digital-handshake.jpg'),
};
