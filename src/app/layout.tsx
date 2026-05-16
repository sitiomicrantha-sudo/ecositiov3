import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { SidebarProvider } from "@/components/ui/sidebar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Sítio Micrantha - Sistema de Gestão",
  description: "Sistema integrado de gestão para sítio agroecológico",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-gray-50 font-sans text-gray-900">
        <TooltipProvider>
          <SidebarProvider>{children}</SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
