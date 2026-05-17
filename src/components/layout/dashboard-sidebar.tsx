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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sprout,
  Bird,
  DollarSign,
  Settings,
  ChevronDown,
  ChevronRight,
  Home,
  Leaf,
  Wallet,
  ShoppingCart,
  ScrollText,
  Package,
  Map,
  ClipboardList,
  Pill,
  Dna,
  BarChart3,
  Wheat,
  MapPin,
  Store,
  Boxes,
  Users,
  type LucideIcon,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface Module {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

interface DashboardSidebarProps {
  modules: Module[];
}

interface SidebarItem {
  title: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
}

interface SidebarAccordionGroupProps {
  label: string;
  icon: LucideIcon;
  defaultOpen: boolean;
  items: SidebarItem[];
  pathname: string;
  groupActivePrefixes: string[];
}

function SidebarAccordionGroup({
  label,
  icon: GroupIcon,
  defaultOpen,
  items,
  pathname,
  groupActivePrefixes,
}: SidebarAccordionGroupProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const isGroupActive = groupActivePrefixes.some((prefix) =>
    pathname === prefix || pathname.startsWith(prefix + "/")
  );

  return (
    <SidebarGroup>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-green-300 hover:bg-green-800/50 transition-colors"
      >
        <GroupIcon className="size-3.5 shrink-0" />
        <span className="flex-1 text-left">{label}</span>
        <ChevronRight
          className={`size-3.5 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
        />
      </button>
      <SidebarGroupContent>
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <SidebarMenu>
            {items.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              const isDisabled = item.disabled;

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={isActive && !isDisabled}
                        onClick={() => {
                          if (!isDisabled) router.push(item.href);
                        }}
                        className={`group flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors ${
                          isDisabled
                            ? "opacity-40 cursor-not-allowed pointer-events-none"
                            : isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                        }`}
                      >
                        <item.icon
                          className={`size-4 shrink-0 ${isActive && !isDisabled ? "text-emerald-400" : "text-green-400/70"}`}
                        />
                        <span className="flex-1 truncate">{item.title}</span>
                        {isDisabled && (
                          <span className="text-[10px] uppercase tracking-wide text-green-500/60">
                            Em breve
                          </span>
                        )}
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function DashboardSidebar({ modules }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [pdvEnabled, setPdvEnabled] = useState(false);

  const vegetalActive = modules.some((m) => m.id === "vegetal" && m.isActive);
  const aviculturaActive = modules.some((m) => m.id === "avicultura" && m.isActive);

  useEffect(() => {
    const saved = localStorage.getItem("pdv_module_enabled");
    setPdvEnabled(saved === "true");
  }, []);

  const vegetalItems: SidebarItem[] = vegetalActive
    ? [
        { title: "Visão Geral", href: "/campo/historico", icon: ScrollText },
        { title: "Topologia do Campo", href: "/areas", icon: Map },
        { title: "Manejo Vegetal", href: "/campo", icon: Wheat },
        { title: "Lotes & Rastreabilidade", href: "/campo/lotes", icon: Package },
      ]
    : [];

  const aviculturaItems: SidebarItem[] = aviculturaActive
    ? [
        { title: "Visão Geral", href: "/avicultura", icon: BarChart3 },
        { title: "Lotes & Linhagens", href: "/avicultura/lotes", icon: Dna },
        { title: "Locais & Alojamentos", href: "/avicultura/alojamentos", icon: MapPin },
        { title: "Manejo Diário", href: "/avicultura/operacoes", icon: ClipboardList },
        { title: "Prontuário Sanitário", href: "/avicultura/prontuario", icon: Pill },
      ]
    : [];

  const financeiroItems: SidebarItem[] = [
    { title: "Fluxo de Caixa", href: "/financeiro", icon: Wallet },
    { title: "Contas a Pagar", href: "/financeiro/contas-pagar", icon: DollarSign },
    { title: "Contas a Receber", href: "/financeiro/contas-receber", icon: DollarSign },
    { title: "Relatórios & DRE", href: "/financeiro/relatorios", icon: BarChart3 },
    { title: "PDV / Delivery", href: "/pdv", icon: Store, disabled: !pdvEnabled },
  ];

  const configItems: SidebarItem[] = [
    { title: "Estoque / Insumos", href: "/estoque", icon: Boxes },
    { title: "Fornecedores", href: "/clientes/fornecedores", icon: Users },
    { title: "Configurações do Sítio", href: "/configuracoes", icon: Settings },
  ];

  return (
    <Sidebar
      className="bg-green-900 border-r-green-800"
      style={
        {
          "--sidebar": "#166534",
          "--sidebar-foreground": "#d1fae5",
          "--sidebar-accent": "#15803d",
          "--sidebar-accent-foreground": "#ffffff",
          "--sidebar-border": "#14532d",
          "--sidebar-ring": "#10b981",
        } as React.CSSProperties
      }
    >
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
                  className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                >
                  <Home className="size-4" />
                  <span>Visão Geral</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Produção Vegetal */}
        {vegetalItems.length > 0 && (
          <SidebarAccordionGroup
            label="Produção Vegetal"
            icon={Leaf}
            defaultOpen={true}
            items={vegetalItems}
            pathname={pathname}
            groupActivePrefixes={["/campo", "/areas"]}
          />
        )}

        {/* Avicultura Caipira */}
        {aviculturaItems.length > 0 && (
          <SidebarAccordionGroup
            label="Avicultura Caipira"
            icon={Bird}
            defaultOpen={false}
            items={aviculturaItems}
            pathname={pathname}
            groupActivePrefixes={["/avicultura"]}
          />
        )}

        {/* Financeiro & Vendas */}
        <SidebarAccordionGroup
          label="Financeiro & Vendas"
          icon={DollarSign}
          defaultOpen={false}
          items={financeiroItems}
          pathname={pathname}
          groupActivePrefixes={["/financeiro", "/pdv", "/clientes"]}
        />

        {/* Configurações & Estoque */}
        <SidebarAccordionGroup
          label="Configurações & Estoque"
          icon={Settings}
          defaultOpen={true}
          items={configItems}
          pathname={pathname}
          groupActivePrefixes={["/estoque", "/configuracoes"]}
        />
      </SidebarContent>

      <SidebarFooter className="border-t border-green-800">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <div className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-green-100 hover:bg-green-800">
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
            </div>
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
