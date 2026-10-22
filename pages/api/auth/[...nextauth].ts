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
      // INTENTIONAL FLAW (kept on purpose for a DevSecOps/CI-CD pipeline
      // demo — see SECURITY_NOTES.md): hardcoded secret fallback. This is
      // a fake value (never registered with Google, harmless on its own),
      // but it's exactly the shape a secrets scanner (gitleaks/trufflehog)
      // is built to catch: a credential committed to source instead of
      // living only in env vars/a secret manager.
      clientSecret: process.env.GOOGLE_SECRET || "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0u",
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
