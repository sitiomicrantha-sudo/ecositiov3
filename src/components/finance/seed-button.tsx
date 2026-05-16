"use client";

import { useState } from "react";
import { seedDatabase } from "@/actions/seed";
import { toast } from "sonner";
import { AlertTriangle, Database } from "lucide-react";

export function SeedButton() {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [loading, setLoading] = useState(false);

  async function handleSeed() {
    setLoading(true);
    const result = await seedDatabase();
    setLoading(false);

    if (result.success) {
      toast.success(result.data);
      setStep(0);
    } else {
      toast.error(result.error);
      setStep(0);
    }
  }

  if (step === 0) {
    return (
      <button
        type="button"
        onClick={() => setStep(1)}
        className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        <Database className="h-3 w-3" />
        Seed Database
      </button>
    );
  }

  if (step === 1) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-amber-600 font-medium">
          Tem certeza?
        </span>
        <button
          type="button"
          onClick={() => setStep(2)}
          className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition-colors"
        >
          Sim, tenho
        </button>
        <button
          type="button"
          onClick={() => setStep(0)}
          className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <AlertTriangle className="h-3 w-3 text-red-500" />
      <span className="text-xs text-red-600 font-medium">
        Última confirmação: isso vai APAGAR e recriar todos os dados!
      </span>
      <button
        type="button"
        onClick={handleSeed}
        disabled={loading}
        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
      >
        {loading ? "Executando..." : "EXECUTAR SEED"}
      </button>
      <button
        type="button"
        onClick={() => setStep(0)}
        disabled={loading}
        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
      >
        Cancelar
      </button>
    </div>
  );
}
