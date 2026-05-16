"use client";

import { useState } from "react";
import { seedDatabase, clearDatabase } from "@/actions/seed";
import { toast } from "sonner";
import { AlertTriangle, Database, Trash2 } from "lucide-react";

export function DbTools() {
  const [seedStep, setSeedStep] = useState<0 | 1 | 2>(0);
  const [clearStep, setClearStep] = useState<0 | 1 | 2>(0);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSeed() {
    setLoading("seed");
    const result = await seedDatabase();
    setLoading(null);
    if (result.success) {
      toast.success(result.data);
    } else {
      toast.error(result.error);
    }
    setSeedStep(0);
  }

  async function handleClear() {
    setLoading("clear");
    const result = await clearDatabase();
    setLoading(null);
    if (result.success) {
      toast.success(result.data);
    } else {
      toast.error(result.error);
    }
    setClearStep(0);
  }

  return (
    <div className="flex items-center gap-3">
      {/* SEED BUTTON */}
      {seedStep === 0 && (
        <button
          type="button"
          onClick={() => setSeedStep(1)}
          disabled={loading !== null}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40"
        >
          <Database className="h-3 w-3" />
          Seed Database
        </button>
      )}
      {seedStep === 1 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-amber-600 font-medium">Tem certeza?</span>
          <button
            type="button"
            onClick={() => setSeedStep(2)}
            className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition-colors"
          >
            Sim
          </button>
          <button
            type="button"
            onClick={() => setSeedStep(0)}
            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}
      {seedStep === 2 && (
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-3 w-3 text-red-500" />
          <span className="text-xs text-red-600 font-medium">Isso vai APAGAR e recriar todos os dados!</span>
          <button
            type="button"
            onClick={handleSeed}
            disabled={loading !== null}
            className="px-2 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {loading === "seed" ? "Executando..." : "EXECUTAR SEED"}
          </button>
          <button
            type="button"
            onClick={() => setSeedStep(0)}
            disabled={loading !== null}
            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* CLEAR BUTTON */}
      {clearStep === 0 && (
        <button
          type="button"
          onClick={() => setClearStep(1)}
          disabled={loading !== null}
          className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
        >
          <Trash2 className="h-3 w-3" />
          Zerar DB
        </button>
      )}
      {clearStep === 1 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-red-600 font-medium">Tem certeza?</span>
          <button
            type="button"
            onClick={() => setClearStep(2)}
            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            Sim
          </button>
          <button
            type="button"
            onClick={() => setClearStep(0)}
            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}
      {clearStep === 2 && (
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-3 w-3 text-red-500" />
          <span className="text-xs text-red-600 font-medium">Isso vai APAGAR TUDO permanentemente!</span>
          <button
            type="button"
            onClick={handleClear}
            disabled={loading !== null}
            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading === "clear" ? "Executando..." : "ZERAR TUDO"}
          </button>
          <button
            type="button"
            onClick={() => setClearStep(0)}
            disabled={loading !== null}
            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
