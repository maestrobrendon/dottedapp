import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/crypto";

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 30);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/calendar",
          ].join(" "),
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async signIn({ user, account }) {
      if (!user.email || !account) return false;

      const existingUser = await db.user.findUnique({
        where: { email: user.email },
      });

      if (existingUser) {
        // Refresh tokens if Google issued new ones
        if (account.access_token || account.refresh_token) {
          await db.user.update({
            where: { email: user.email },
            data: {
              googleAccessToken: account.access_token
                ? encrypt(account.access_token)
                : undefined,
              googleRefreshToken: account.refresh_token
                ? encrypt(account.refresh_token)
                : undefined,
              googleTokenExpiry: account.expires_at
                ? new Date(account.expires_at * 1000)
                : undefined,
            },
          });
        }
      } else {
        // First sign-in — create the user with a unique slug
        let slug = generateSlug(user.name ?? user.email.split("@")[0]);

        // Retry on the rare slug collision
        const slugExists = await db.user.findUnique({ where: { slug } });
        if (slugExists) slug = generateSlug(user.name ?? user.email.split("@")[0]);

        await db.user.create({
          data: {
            email: user.email,
            name: user.name ?? null,
            image: user.image ?? null,
            slug,
            googleAccessToken: account.access_token
              ? encrypt(account.access_token)
              : null,
            googleRefreshToken: account.refresh_token
              ? encrypt(account.refresh_token)
              : null,
            googleTokenExpiry: account.expires_at
              ? new Date(account.expires_at * 1000)
              : null,
          },
        });
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await db.user.findUnique({
          where: { email: user.email },
          select: { id: true, slug: true },
        });
        if (dbUser) {
          (token as DottdJWT).userId = dbUser.id;
          (token as DottdJWT).slug = dbUser.slug;
        }
      }
      return token;
    },

    async session({ session, token }) {
      const t = token as DottdJWT;
      session.user.id = t.userId ?? "";
      session.user.slug = t.slug ?? "";
      return session;
    },
  },

  pages: {
    signIn: "/",
  },
});

// Internal JWT shape (not exported — only used inside this file's callbacks)
interface DottdJWT {
  userId?: string;
  slug?: string;
}

// Augment next-auth Session type
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      slug: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
