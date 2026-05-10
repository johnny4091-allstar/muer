import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { profile: true },
        });

        if (!user || !user.passwordHash) return null;
        if (user.isBanned) throw new Error("Account banned");
        if (!user.emailVerified) throw new Error("Email not verified");

        const isValid = await bcrypt.compare(credentials.password as string, user.passwordHash);
        if (!isValid) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastSeenAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          role: user.role,
          isBanned: user.isBanned,
          image: user.profile?.avatarUrl ?? null,
        };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "credentials") {
        const existingUser = await prisma.user.findUnique({ where: { email: user.email! } });
        if (existingUser?.isBanned) return false;

        if (!existingUser) {
          const username = await generateUniqueUsername(user.name ?? user.email!.split("@")[0]);
          await prisma.user.update({
            where: { id: user.id },
            data: {
              username,
              emailVerified: new Date(),
              profile: {
                create: {
                  avatarUrl: user.image ?? null,
                },
              },
            },
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
        token.role = (user as any).role;
        token.isBanned = (user as any).isBanned;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as string;
        session.user.isBanned = token.isBanned as boolean;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      const username = await generateUniqueUsername(user.name ?? user.email!.split("@")[0]);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          username,
          profile: { create: {} },
        },
      });
    },
  },
});

async function generateUniqueUsername(base: string): Promise<string> {
  const clean = base.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20) || "user";
  const existing = await prisma.user.findUnique({ where: { username: clean } });
  if (!existing) return clean;
  const suffix = Math.floor(Math.random() * 9000) + 1000;
  return `${clean}${suffix}`;
}
