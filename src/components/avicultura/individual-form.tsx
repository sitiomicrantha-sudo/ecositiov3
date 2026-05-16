"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Plus, Loader2 } from "lucide-react";
import {
  createPoultryIndividual,
  getActiveIndividualsForSelect,
  getActiveBatchesForSelect,
} from "@/actions/poultry";
import type { poultryIndividuals, poultryBatches } from "@/db/schema";

type Individual = typeof poultryIndividuals.$inferSelect;
type Batch = typeof poultryBatches.$inferSelect;

const individualFormSchema = z.object({
  ringId: z.string().min(1, "Anilha é obrigatória").max(50),
  name: z.string().max(255).optional(),
  gender: z.enum(["macho", "femea"], { message: "Selecione o gênero" }),
  fatherId: z.number().int().positive().optional(),
  motherId: z.number().int().positive().optional(),
  batchId: z.number().int().positive().optional(),
});

type IndividualFormValues = z.infer<typeof individualFormSchema>;

interface IndividualFormProps {
  onSuccess: () => void;
}

export function IndividualForm({ onSuccess }: IndividualFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fathers, setFathers] = useState<Individual[]>([]);
  const [mothers, setMothers] = useState<Individual[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const form = useForm<IndividualFormValues>({
    resolver: zodResolver(individualFormSchema),
    defaultValues: {
      ringId: "",
      name: "",
      gender: "femea",
      fatherId: undefined,
      motherId: undefined,
      batchId: undefined,
    },
  });

  useEffect(() => {
    if (open) {
      loadOptions();
    }
  }, [open]);

  async function loadOptions() {
    setLoadingOptions(true);

    const [individualsResult, batchesResult] = await Promise.all([
      getActiveIndividualsForSelect(),
      getActiveBatchesForSelect(),
    ]);

    if (individualsResult.success) {
      setFathers(individualsResult.data.filter((i) => i.gender === "macho"));
      setMothers(individualsResult.data.filter((i) => i.gender === "femea"));
    }

    if (batchesResult.success) {
      setBatches(batchesResult.data);
    }

    setLoadingOptions(false);
  }

  async function onSubmit(values: IndividualFormValues) {
    setIsSubmitting(true);

    try {
      const result = await createPoultryIndividual(values);

      if (result.success) {
        toast.success("Indivíduo cadastrado com sucesso!");
        form.reset();
        setOpen(false);
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Erro inesperado ao cadastrar indivíduo");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger onClick={() => setOpen(true)}>
        <div className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700">
          <Plus className="mr-2 size-4" />
          Cadastrar Matriz/Galo
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-amber-900">Cadastrar Matriz/Galo</DialogTitle>
          <DialogDescription>
            Adicione uma ave reprodutora ao registro genético com pedigree.
          </DialogDescription>
        </DialogHeader>

        {loadingOptions ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="ringId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número da Anilha</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: RIR-2024-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Daffy" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gênero</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          {...field}
                        >
                          <option value="femea">♀ Fêmea (Matriz)</option>
                          <option value="macho">♂ Macho (Galo)</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fatherId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pai (opcional)</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(e.target.value ? Number(e.target.value) : undefined)
                          }
                        >
                          <option value="">Sem pai registrado</option>
                          {fathers.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.ringId} {f.name ? `(${f.name})` : ""}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="motherId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mãe (opcional)</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(e.target.value ? Number(e.target.value) : undefined)
                          }
                        >
                          <option value="">Sem mãe registrada</option>
                          {mothers.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.ringId} {m.name ? `(${m.name})` : ""}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="batchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lote de Origem (opcional)</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(e.target.value ? Number(e.target.value) : undefined)
                        }
                      >
                        <option value="">Sem lote vinculado</option>
                        {batches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-4">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => setOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white ring-offset-background transition-colors hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar"
                  )}
                </button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
