"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Map,
  Sprout,
  Bird,
  Package,
  DollarSign,
  Settings,
  ChevronDown,
  Home,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

const operationsItems = [
  { title: "Topologia / Áreas", href: "/areas", icon: Map },
  { title: "Caderno de Campo", href: "/campo", icon: Sprout },
  { title: "Avicultura", href: "/avicultura", icon: Bird },
];

const salesItems = [
  { title: "Inventário", href: "/inventario", icon: Package },
  { title: "Clientes", href: "/clientes", icon: DollarSign },
];

const settingsItems = [
  { title: "Configurações", href: "/configuracoes", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Sidebar className="bg-green-900 border-r-green-800">
      <SidebarHeader className="border-b border-green-800 px-4 py-4">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 hover:opacity-90"
        >
          <Sprout className="size-6 text-emerald-400" />
          <span className="text-lg font-semibold text-white">
            Sítio Micrantha
          </span>
        </button>
      </SidebarHeader>

      <SidebarContent>
        {/* Home */}
        <SidebarGroup className="pb-0">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === "/"}
                  onClick={() => router.push("/")}
                  className="text-green-100 hover:bg-green-800 hover:text-white data-[active=true]:bg-green-800 data-[active=true]:text-emerald-400"
                >
                  <Home className="size-4" />
                  <span>Visão Geral</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Operações */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-green-300">
            Operações
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {operationsItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    onClick={() => router.push(item.href)}
                    className="text-green-100 hover:bg-green-800 hover:text-white data-[active=true]:bg-green-800 data-[active=true]:text-emerald-400"
                  >
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Estoque & Vendas */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-green-300">
            Estoque & Vendas
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {salesItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    onClick={() => router.push(item.href)}
                    className="text-green-100 hover:bg-green-800 hover:text-white data-[active=true]:bg-green-800 data-[active=true]:text-emerald-400"
                  >
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Configurações */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-green-300">
            Configurações
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    onClick={() => router.push(item.href)}
                    className="text-green-100 hover:bg-green-800 hover:text-white data-[active=true]:bg-green-800 data-[active=true]:text-emerald-400"
                  >
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-green-800">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <button className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-green-100 hover:bg-green-800">
              <div className="flex size-8 items-center justify-center rounded-full bg-green-700 text-xs font-medium text-white">
                A
              </div>
              <div className="flex-1 truncate">
                <p className="truncate text-sm font-medium">Administrador</p>
                <p className="truncate text-xs text-green-300">
                  admin@sitio.com
                </p>
              </div>
              <ChevronDown className="size-4 text-green-300" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" className="w-56">
            <DropdownMenuItem>Perfil</DropdownMenuItem>
            <DropdownMenuItem>Configurações</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
