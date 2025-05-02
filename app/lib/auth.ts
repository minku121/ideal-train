import type { DefaultSession, DefaultUser, NextAuthOptions } from "next-auth";
import prisma from "@/app/lib/prisma";
import CredentialsProvider from "next-auth/providers/credentials";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: number;
      name?: string | null;
      email?: string | null;
      role: string | null; // Removed image, added role
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: number;
    name?: string | null;
    email?: string | null;
    role: string | null; // Removed image, added role
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: number;
    name?: string | null;
    email?: string | null;
    role: string | null; // Removed image, added role
  }
}

interface CredentialsType {
  email: string;
  password: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "john.doe@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          console.log('Authorize called with credentials:', credentials);
          // Accept both 'email' and 'username' as the key for email
          // Accept both 'email' and 'username' as the key for email
          // @ts-ignore
          const userEmail = credentials?.email || credentials?.username;
          const userPass = credentials?.password;
          console.log('Checking userEmail:', userEmail, 'and password:', userPass);
          if (!userEmail || !userPass) {
            console.log('Missing email/username or password');
            return null;
          }

          const user = await prisma.user.findUnique({
            where: { email: userEmail },
          });
          console.log('User found:', user);
          if (user) {
            console.log('DB password:', user.password);
            console.log('Input password:', userPass);
          }

          if (!user) {
            console.log('No user found with this email');
            return null;
          }

          if (user.password === credentials.password) {
            console.log('Password match, login successful');
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role, // Include role in the return object
            };
          } else {
            console.log('Password does not match');
            return null;
          }
        } catch (error) {
          console.error('Error in authorize:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id,
          name: token.name,
          email: token.email,
          role: token.role, // Include role, no image
        };
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = Number(user.id);
        token.name = user.name;
        token.email = user.email;
        token.role = user.role; // Add role to JWT token, no image
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  debug: false,
};
