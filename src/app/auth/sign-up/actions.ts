"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { signIn } from "@/lib/auth";

export async function signUpAction(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return { error: "All fields are required" };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    return { error: "An account with this email already exists" };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.insert(users).values({ name, email, passwordHash });

  await signIn("credentials", { email, password, redirectTo: "/" });
  // Auth.js signIn() with redirectTo throws NEXT_REDIRECT internally — this
  // line is unreachable in normal execution but satisfies the TypeScript return type.
  return { error: null };
}
