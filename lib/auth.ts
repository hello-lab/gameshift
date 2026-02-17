import jwt from "jsonwebtoken";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export type SessionPayload = {
  sub: string;
  email: string;
  username: string;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }

  return secret;
}

export function signSession(payload: SessionPayload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: SESSION_TTL_SECONDS });
}

export function verifySession(token?: string): SessionPayload | null {
  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, getJwtSecret()) as SessionPayload;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  name: "gs_session",
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};
