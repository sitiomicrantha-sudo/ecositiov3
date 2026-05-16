"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/": "Visão Geral",
  "/areas": "Topologia / Áreas",
  "/campo": "Caderno de Campo",
  "/avicultura": "Avicultura & Genética",
  "/estoque": "Estoque / Germoplasma",
  "/inventario": "Inventário",
  "/clientes": "Clientes",
  "/configuracoes": "Configurações",
};

export function DashboardHeader() {
  const pathname = usePathname();
  const title = pageTitles[pathname] || "Sítio Micrantha";

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-white px-4 md:px-6">
      <SidebarTrigger className="-ml-1 text-green-800 hover:bg-green-50" />
      <Separator orientation="vertical" className="h-6" />
      <div className="flex flex-1 items-center gap-4">
        <h1 className="text-lg font-semibold text-green-900">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-gray-600 md:inline">
          Sítio Micrantha
        </span>
        <Avatar className="size-9 border-2 border-green-200">
          <AvatarFallback className="bg-green-800 text-sm font-medium text-white">
            SM
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
