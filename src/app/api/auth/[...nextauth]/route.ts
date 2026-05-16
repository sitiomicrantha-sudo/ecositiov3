import { handlers } from "@/auth";

// Route handler para NextAuth v5
// Gerencia todas as rotas de autenticação (/api/auth/*)
export const { GET, POST } = handlers;
