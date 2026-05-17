import { notFound } from "next/navigation";
import { getHarvestBatchByToken } from "@/actions/field-activities";
import { QRCodeSVG } from "qrcode.react";
import { Sprout, Calendar, MapPin, Package, ShieldCheck } from "lucide-react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default async function PublicLotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const result = await getHarvestBatchByToken(token);

  if (!result.success) {
    notFound();
  }

  const batch = result.data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="mx-auto max-w-md px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-emerald-100">
            <ShieldCheck className="size-7 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Sítio Micrantha</h1>
          <p className="mt-1 text-sm text-gray-500">Rastreabilidade Orgânica</p>
        </div>

        {/* Product Card */}
        <div className="mb-6 rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Package className="size-5 text-emerald-600" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Produto
            </span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {batch.itemName || "Produto Orgânico"}
          </h2>

          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50">
                <Package className="size-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Lote</p>
                <p className="font-mono text-sm font-bold text-emerald-700">
                  {batch.loteCode}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50">
                <Calendar className="size-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Data da Colheita</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(batch.harvestedAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            {batch.bedName && (
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-green-50">
                  <Sprout className="size-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Canteiro de Origem</p>
                  <p className="text-sm font-medium text-gray-900">
                    {batch.bedShortCode ? `[${batch.bedShortCode}] ` : ""}
                    {batch.bedName}
                  </p>
                  {batch.glebeName && (
                    <p className="text-xs text-gray-400">
                      {batch.glebeName}
                      {batch.fieldName && ` • ${batch.fieldName}`}
                    </p>
                  )}
                </div>
              </div>
            )}

            {batch.quantity && (
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-amber-50">
                  <MapPin className="size-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Quantidade Colhida</p>
                  <p className="text-sm font-medium text-gray-900">
                    {batch.quantity}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* QR Code Card */}
        <div className="mb-6 rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-600" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Verificação
            </span>
          </div>
          <div className="flex justify-center">
            <div className="rounded-xl bg-white p-3">
              <QRCodeSVG
                value={`${APP_URL}/p/lote/${batch.publicToken}`}
                size={180}
                level="M"
                includeMargin={false}
              />
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-gray-400 break-all">
            {APP_URL}/p/lote/{batch.publicToken}
          </p>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-400">
            Produto de agricultura orgânica agroecológica
          </p>
          <p className="mt-1 text-xs text-gray-300">
            Sítio Micrantha • {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
