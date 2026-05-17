"use client";

import { useState, useEffect, useCallback } from "react";
import { getPoultryLocations, softDeletePoultryLocation, restorePoultryLocation } from "@/actions/poultry";
import { LocationsTable } from "@/components/avicultura/locations-table";
import { LocationForm } from "@/components/avicultura/location-form";
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";
import { MapPin, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { poultryLocations } from "@/db/schema";

type Location = typeof poultryLocations.$inferSelect;

export default function LocaisPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<Location | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPoultryLocations();
      if (result.success) {
        setLocations(result.data);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Erro ao carregar locais");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleEdit(location: Location) {
    setEditingLocation(location);
    setFormOpen(true);
  }

  function handleNew() {
    setEditingLocation(null);
    setFormOpen(true);
  }

  function handleToggleActive(location: Location) {
    setToggleTarget(location);
  }

  async function confirmToggle() {
    if (!toggleTarget) return;

    try {
      let result;
      if (toggleTarget.isActive) {
        result = await softDeletePoultryLocation(toggleTarget.id);
      } else {
        result = await restorePoultryLocation(toggleTarget.id);
      }

      if (result.success) {
        toast.success(
          toggleTarget.isActive
            ? "Local desativado com sucesso"
            : "Local restaurado com sucesso"
        );
        fetchData();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Erro ao alterar status do local");
    } finally {
      setToggleTarget(null);
    }
  }

  function handleFormSuccess() {
    setFormOpen(false);
    setEditingLocation(null);
    fetchData();
  }

  return (
    <div className="space-y-6">
      <BreadcrumbNav
        items={[
          { label: "Avicultura", href: "/avicultura" },
          { label: "Locais" },
        ]}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-gray-900">
            <MapPin className="size-6 text-emerald-600" />
            Locais Físicos
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie galpões, piquetes rotativos e pinteiros para o manejo das aves.
          </p>
        </div>
        <LocationForm onSuccess={handleFormSuccess} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      ) : (
        <LocationsTable
          locations={locations}
          onEdit={handleEdit}
          onToggleActive={handleToggleActive}
        />
      )}

      {/* Edit/Create Dialog */}
      {formOpen && (
        <LocationForm
          location={editingLocation}
          onSuccess={handleFormSuccess}
          triggerLabel=""
        />
      )}

      {/* Toggle Active Confirmation */}
      <AlertDialog open={!!toggleTarget} onOpenChange={(open) => !open && setToggleTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleTarget?.isActive ? "Desativar Local" : "Restaurar Local"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleTarget?.isActive
                ? `Tem certeza que deseja desativar "${toggleTarget.name}"? Locais desativados não aparecerão nas opções de alojamento.`
                : `Tem certeza que deseja restaurar "${toggleTarget?.name}"? O local voltará a ficar disponível para alojamento.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmToggle}
              className={toggleTarget?.isActive ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}
            >
              {toggleTarget?.isActive ? "Desativar" : "Restaurar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
