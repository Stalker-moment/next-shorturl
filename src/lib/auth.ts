import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
         if (!credentials?.email || !credentials?.password) return null;
         
         const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1888'}/api/auth/login`, {
           method: 'POST',
           body: JSON.stringify({ 
               email: credentials.email, 
               password: credentials.password,
               turnstileToken: (credentials as any).turnstileToken 
           }),
           headers: { "Content-Type": "application/json" }
         });

         const data = await res.json();
         if (res.ok && data.user) {
             return data.user;
         }
         return null;
      }
    })
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login', 
  },
  callbacks: {
    async jwt({ token, user, account, profile, trigger, session }) {
      if (user) {
         token.id = user.id;
         // @ts-expect-error
         token.role = user.role || 'USER';
         token.email = user.email;
         token.name = user.name;
         if (user.image) token.picture = user.image;
      }

      // If Google Provider is triggered
      if (account && account.provider === 'google' && profile) {
         // Is the user already logged in manually? (token.id is populated)
         if (token.id) {
            // Linking Request!
            // Validate that the Google email matches the logged-in email
            if (profile.email !== token.email) {
               throw new Error("Email Google harus sama dengan email akun Anda.");
            }

            // Call backend /api/user/link-google to link Google account
            const linkRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1888'}/api/user/link-google`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ userId: token.id })
            });

            if (!linkRes.ok) {
               const errData = await linkRes.json();
               throw new Error(errData.error || "Gagal menautkan akun Google.");
            }

            // Set token property so we know it's linked
            token.googleLinked = true;
         } else {
            // Login/Register Request!
            // Call backend /api/auth/google to login/register Google user
            const authRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1888'}/api/auth/google`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                  email: profile.email,
                  name: profile.name,
                  image: (profile as any).picture || null,
                  googleId: profile.sub
               })
            });

            const data = await authRes.json();
            if (!authRes.ok) {
               throw new Error(data.error || "Gagal masuk menggunakan Google.");
            }

            // Populate JWT token with backend user fields
            token.id = data.user.id;
            token.role = data.user.role || 'USER';
            token.email = data.user.email;
            token.name = data.user.name;
            if (data.user.image) token.picture = data.user.image;
            token.googleLinked = data.user.googleLinked;
         }
      }

      if (trigger === "update" && session) {
         if (session.name) token.name = session.name;
         if (session.image) token.picture = session.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
         // @ts-expect-error
         session.user.id = token.id;
         // @ts-expect-error
         session.user.role = token.role;
         // @ts-expect-error
         session.user.googleLinked = token.googleLinked;
         if (token.picture) session.user.image = token.picture;
         if (token.name) session.user.name = token.name;
      }
      return session;
    }
  }
}