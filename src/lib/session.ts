import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
    userId?: string;
    organizationId?: string;
    isLoggedIn: boolean;
}

export const defaultSession: SessionData = {
    isLoggedIn: false,
};

// SESSION_SECRET deve ter 32+ caracteres e estar em variavel de ambiente
export const sessionOptions = {
    password: process.env.SESSION_SECRET as string,
    cookieName: "crm_iron_session",
    cookieOptions: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax" as const,
    },
};

export async function getSession() {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.isLoggedIn) {
        session.isLoggedIn = defaultSession.isLoggedIn;
    }

    return session;
}
