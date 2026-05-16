import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

// Configuração do Auth.js (NextAuth v5)
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // Provedor Google (OAuth)
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    // Provedor Credentials (email/senha) - pronto para implementação futura
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        // TODO: Implementar autenticação com banco de dados
        // Por enquanto, retorna null (não autenticado)
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        // Implementar verificação de usuário no banco
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
