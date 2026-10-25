import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { findUserByEmail, verifyPassword } from "../../../library/users";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      // [test/pipeline-full-green] Fixed: no hardcoded fallback — a missing
      // GOOGLE_SECRET now fails loudly at startup instead of silently using
      // a secret-shaped literal, closing the issue in SECURITY_NOTES.md.
      // Not merged to main — this branch only verifies the pipeline
      // deploys when the app is clean.
      clientSecret: process.env.GOOGLE_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await findUserByEmail(credentials.email);
        if (!user) return null;

        const isValid = await verifyPassword(
          user.passwordHash,
          credentials.password
        );
        if (!isValid) return null;

        if (!user.emailVerifiedAt) {
          throw new Error("Please confirm your email before signing in");
        }

        return { id: String(user.id), email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account?.provider) {
        (token as any).provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).provider = (token as any).provider ?? "credentials";
      return session;
    },
  },
};

export default NextAuth(authOptions);
