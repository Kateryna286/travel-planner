/**
 * Auth.js v5 configuration.
 *
 * Uses JWT strategy (stateless, edge-compatible) with the Drizzle adapter
 * for persisting OAuth accounts. The jwt + session callbacks explicitly
 * propagate user.id into token.sub and back into session.user.id, since
 * Auth.js v5 does not do this by default.
 */
import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { authorizeCredentials } from "@/lib/auth-credentials";

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: schema.users,
    accountsTable: schema.accounts,
    sessionsTable: schema.sessions,
    verificationTokensTable: schema.verificationTokens,
  }),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;
        return authorizeCredentials(
          credentials.email as string,
          credentials.password as string
        );
      },
    }),
    Google,
  ],
  callbacks: {
    jwt({ token, user }) {
      // Persist user.id into the token on first sign-in
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      // Expose user.id to route handlers via session
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
  pages: {
    signIn: "/auth/sign-in",
  },
});
