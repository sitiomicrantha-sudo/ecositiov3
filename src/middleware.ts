export { auth as middleware } from "@/auth";

export const config = {
  // Rotas que requerem autenticação
  // Adicionar rotas protegidas aqui quando necessário
  matcher: ["/dashboard/:path*"],
};
