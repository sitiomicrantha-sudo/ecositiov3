"use client";

import { useState, useEffect, useCallback } from "react";
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";
import { SoilTimeline } from "@/components/campo/soil-timeline";
import { getBedOpacDossier, getActiveBedsForDossier } from "@/actions/soil-history";
import type { BedDossier } from "@/actions/soil-history";
import {
  Sprout,
  Calendar,
  MapPin,
  Clock,
  Ruler,
  Leaf,
  Loader2,
} from "lucide-react";

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function daysAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "1 dia atrás";
  if (diffDays < 7) return `${diffDays} dias atrás`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses atrás`;
  return `${Math.floor(diffDays / 365)} anos atrás`;
}

export default function SoilHistoryPage() {
  const [beds, setBeds] = useState<
    {
      id: number;
      name: string;
      shortCode: string | null;
      fieldName: string | null;
      fieldShortCode: string | null;
      glebeName: string | null;
      glebeShortCode: string | null;
    }[]
  >([]);
  const [selectedBedId, setSelectedBedId] = useState<number | null>(null);
  const [dossier, setDossier] = useState<BedDossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDossier, setLoadingDossier] = useState(false);

  const loadBeds = useCallback(async () => {
    setLoading(true);
    const result = await getActiveBedsForDossier();
    if (result.success) {
      setBeds(result.data);
      if (result.data.length > 0) {
        setSelectedBedId(result.data[0].id);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadBeds();
  }, [loadBeds]);

  useEffect(() => {
    if (!selectedBedId) return;

    setLoadingDossier(true);
    getBedOpacDossier(selectedBedId).then((result) => {
      if (result.success) {
        setDossier(result.data);
      }
      setLoadingDossier(false);
    });
  }, [selectedBedId]);

  const selectedBed = beds.find((b) => b.id === selectedBedId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BreadcrumbNav
        items={[
          { label: "Caderno de Campo", href: "/campo" },
          { label: "Histórico do Solo" },
        ]}
      />

      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 print:text-black">
          Dossiê do Canteiro
        </h2>
        <p className="mt-1 text-sm text-gray-500 print:hidden">
          Rastreabilidade completa para auditoria OPAC/SPG.
        </p>
      </div>

      <div className="print:hidden">
        <label htmlFor="bed-select" className="block text-sm font-medium text-gray-700">
          Selecionar Canteiro
        </label>
        <select
          id="bed-select"
          className="mt-1 flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={selectedBedId || ""}
          onChange={(e) => setSelectedBedId(Number(e.target.value))}
        >
          {beds.map((bed) => (
            <option key={bed.id} value={bed.id}>
              {bed.shortCode ? `[${bed.shortCode}] ${bed.name}` : bed.name}
              {bed.fieldName ? ` — ${bed.fieldName}` : ""}
              {bed.glebeName ? ` (${bed.glebeName})` : ""}
            </option>
          ))}
        </select>
      </div>

      {loadingDossier ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-8 animate-spin text-emerald-600" />
        </div>
      ) : dossier ? (
        <>
          {/* Print-only header */}
          <div className="hidden print:block mb-4">
            <h1 className="text-xl font-bold text-black">
              Dossiê do Canteiro: {dossier.bed.shortCode ? `[${dossier.bed.shortCode}] ` : ""}{dossier.bed.name}
            </h1>
            <p className="text-sm text-gray-600">
              {dossier.bed.glebeName} &gt; {dossier.bed.fieldName} &bull; Área: {Number(dossier.bed.area).toLocaleString("pt-BR")} m²
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Gerado em {new Date().toLocaleDateString("pt-BR")} &bull; Sistema Sítio Micrantha
            </p>
          </div>

          {/* Vital Signs Card */}
          <div className="rounded-xl border bg-white p-5 shadow-sm print:shadow-none print:border-gray-300">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 print:text-gray-600">
              Sinais Vitais
            </h3>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Location */}
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 print:bg-transparent print:border print:border-gray-300">
                  <MapPin className="size-4 text-emerald-600 print:text-black" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 print:text-gray-600">Localização</p>
                  <p className="text-sm font-medium text-gray-900 print:text-black">
                    {dossier.bed.glebeName}
                    {dossier.bed.fieldName && ` > ${dossier.bed.fieldName}`}
                  </p>
                </div>
              </div>

              {/* Area */}
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 print:bg-transparent print:border print:border-gray-300">
                  <Ruler className="size-4 text-blue-600 print:text-black" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 print:text-gray-600">Área</p>
                  <p className="text-sm font-medium text-gray-900 print:text-black">
                    {Number(dossier.bed.area).toLocaleString("pt-BR")} m²
                  </p>
                </div>
              </div>

              {/* Active Plantings */}
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-green-50 print:bg-transparent print:border print:border-gray-300">
                  <Sprout className="size-4 text-green-600 print:text-black" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 print:text-gray-600">Culturas Ativas</p>
                  {dossier.vitalSigns.activePlantings.length > 0 ? (
                    <div className="space-y-0.5">
                      {dossier.vitalSigns.activePlantings.map((p, i) => (
                        <p key={i} className="text-sm font-medium text-gray-900 print:text-black">
                          {p.itemName}
                          <span className="ml-1 text-xs text-gray-500 print:text-gray-600">
                            ({p.status === "permanent" ? "perene" : "ativo"})
                          </span>
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 print:text-gray-500">Nenhuma</p>
                  )}
                </div>
              </div>

              {/* Last Fertility */}
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 print:bg-transparent print:border print:border-gray-300">
                  <Leaf className="size-4 text-amber-600 print:text-black" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 print:text-gray-600">Última Fertilidade</p>
                  {dossier.vitalSigns.lastFertilityDate ? (
                    <div>
                      <p className="text-sm font-medium text-gray-900 print:text-black">
                        {dossier.vitalSigns.daysSinceFertility === 0
                          ? "Hoje"
                          : `${dossier.vitalSigns.daysSinceFertility} dias atrás`}
                      </p>
                      <p className="text-xs text-gray-500 print:text-gray-600">
                        {formatDate(dossier.vitalSigns.lastFertilityDate)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 print:text-gray-500">Sem registro</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-xl border bg-white p-5 shadow-sm print:shadow-none print:border-gray-300">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 print:text-gray-600">
                Linha do Tempo — Dossiê OPAC
              </h3>
              <span className="text-xs text-gray-400 print:text-gray-500">
                {dossier.timeline.length} registros
              </span>
            </div>
            <SoilTimeline entries={dossier.timeline} />
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white py-16 text-center">
          <Calendar className="mb-4 size-12 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900">
            Selecione um canteiro
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Escolha um canteiro acima para visualizar o dossiê.
          </p>
        </div>
      )}
    </div>
  );
}
