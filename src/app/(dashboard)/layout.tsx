import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { SidebarInset } from "@/components/ui/sidebar";
import { getActiveModules, ensureDefaultModules } from "@/actions/system-modules";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await ensureDefaultModules();
  const modulesResult = await getActiveModules();
  const modules = modulesResult.success ? (modulesResult.data ?? []) : [];

  return (
    <SidebarProvider>
      <DashboardSidebar modules={modules} />
      <SidebarInset className="flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
