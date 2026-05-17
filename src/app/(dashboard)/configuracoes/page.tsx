"use client";

import { useState, useEffect } from "react";
import { getActiveModules, toggleModule } from "@/actions/system-modules";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Sprout, Bird, Egg, Fence, Settings, Store } from "lucide-react";

interface Module {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

const moduleIcons: Record<string, any> = {
  vegetal: Sprout,
  avicultura: Bird,
  criatorio: Egg,
  prv: Fence,
};

export default function ConfiguracoesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [pdvEnabled, setPdvEnabled] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const result = await getActiveModules();
    if (result.success && result.data) {
      setModules(result.data);
    } else {
      toast.error("Erro ao carregar módulos do sistema");
    }
    const saved = localStorage.getItem("pdv_module_enabled");
    setPdvEnabled(saved === "true");
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  async function handleToggle(moduleId: string, currentStatus: boolean) {
    const result = await toggleModule(moduleId, !currentStatus);
    if (result.success) {
      toast.success(`Módulo ${moduleId === 'vegetal' ? 'Vegetal' : moduleId === 'avicultura' ? 'Avicultura' : moduleId === 'criatorio' ? 'Criatório' : 'PRV'} ${!currentStatus ? 'ativada' : 'desativada'}`);
      await fetchData();
    } else {
      toast.error(result.error);
    }
  }

  function handlePdvToggle(enabled: boolean) {
    setPdvEnabled(enabled);
    localStorage.setItem("pdv_module_enabled", enabled.toString());
    toast.success(enabled ? "Módulo PDV ativado!" : "Módulo PDV desativado");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Configurações do Sistema
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Gerencie os módulos ativos do seu ERP Agroecológico.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <Settings className="size-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Módulos do Sistema</h3>
        </div>

        <div className="grid gap-4">
          {modules.map((module) => {
            const Icon = moduleIcons[module.id] || Settings;
            return (
              <div 
                key={module.id} 
                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className={`flex size-10 items-center justify-center rounded-full ${
                    module.isActive ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400"
                  }`}>
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{module.name}</p>
                    <p className="text-xs text-gray-500">{module.description || "Sem descrição"}</p>
                  </div>
                </div>
                <Switch 
                  checked={module.isActive} 
                  onCheckedChange={() => handleToggle(module.id, module.isActive)}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <Store className="size-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Funcionalidades</h3>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-4">
            <div className={`flex size-10 items-center justify-center rounded-full ${
              pdvEnabled ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400"
            }`}>
              <Store className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Módulo de Vendas / PDV</p>
              <p className="text-xs text-gray-500">Ponto de venda e delivery com recibo WhatsApp</p>
            </div>
          </div>
          <Switch checked={pdvEnabled} onCheckedChange={handlePdvToggle} />
        </div>
      </div>
    </div>
  );
}
