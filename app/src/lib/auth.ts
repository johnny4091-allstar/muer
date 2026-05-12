import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const reseller = await prisma.reseller.findUnique({
          where: { email: credentials.email },
        });

        if (!reseller) return null;

        const valid = await bcrypt.compare(
          credentials.password,
          reseller.passwordHash
        );
        if (!valid) return null;

        return {
          id: reseller.id,
          email: reseller.email,
          name: reseller.name,
          tier: reseller.tier,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.tier = (user as { tier?: string }).tier;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { tier?: string }).tier = token.tier as string;
      }
      return session;
    },
  },
};
