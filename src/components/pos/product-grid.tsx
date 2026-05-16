"use client";

import { Search, Package } from "lucide-react";

interface Product {
  id: number;
  name: string;
  unit: string;
  basePrice: string | null;
  currentStock: number;
}

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function ProductGrid({ products, onAddToCart, searchQuery, onSearchChange }: ProductGridProps) {
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar produto..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="mb-3 size-12 text-gray-200" />
            <p className="text-sm text-gray-400">
              {searchQuery ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {filtered.map((product) => {
              const price = product.basePrice ? parseFloat(product.basePrice) : 0;
              const isLowStock = product.currentStock <= 5;
              const isOutOfStock = product.currentStock <= 0;

              return (
                <button
                  key={product.id}
                  onClick={() => !isOutOfStock && onAddToCart(product)}
                  disabled={isOutOfStock}
                  className={`flex flex-col rounded-xl border p-4 text-left transition-all ${
                    isOutOfStock
                      ? "cursor-not-allowed border-gray-100 bg-gray-50 opacity-50"
                      : "cursor-pointer border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-medium text-gray-900 line-clamp-2 flex-1">
                      {product.name}
                    </h4>
                  </div>

                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <p className="text-lg font-bold text-emerald-700">
                        R$ {price.toFixed(2).replace(".", ",")}
                      </p>
                      <p className="text-xs text-gray-400">
                        por {product.unit === "unit" ? "unidade" : product.unit}
                      </p>
                    </div>

                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      isOutOfStock
                        ? "bg-gray-100 text-gray-500"
                        : isLowStock
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}>
                      Est: {product.currentStock}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
