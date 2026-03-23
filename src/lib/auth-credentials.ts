/**
 * Extracted credentials-authorize logic, kept separate from Auth.js config
 * so it can be unit-tested without the full NextAuth initialisation.
 *
 * Returns null for both wrong passwords AND OAuth-only accounts
 * (passwordHash === null), preventing credential sign-in for Google-only users.
 */
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
}

export async function authorizeCredentials(
  email: string,
  password: string
): Promise<AuthUser | null> {
  const normalizedEmail = email.toLowerCase().trim();
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  const user = rows[0] ?? null;
  if (!user || !user.passwordHash) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return { id: user.id, name: user.name, email: user.email };
}
