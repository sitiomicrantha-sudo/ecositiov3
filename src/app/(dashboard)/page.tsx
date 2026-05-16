import { Sprout, Bird, Package, DollarSign } from "lucide-react";

const stats = [
  {
    title: "Propriedades",
    value: "0",
    description: "Cadastradas",
    icon: Sprout,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  {
    title: "Lotes de Aves",
    value: "0",
    description: "Ativos",
    icon: Bird,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    title: "Itens em Estoque",
    value: "0",
    description: "Cadastrados",
    icon: Package,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "Saldo do Mês",
    value: "R$ 0,00",
    description: "Fluxo de caixa",
    icon: DollarSign,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Bem-vindo ao Sítio Micrantha
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Painel de gestão agroecológica. Comece cadastrando suas áreas de
          produção.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="rounded-xl border bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div
                className={`flex size-10 items-center justify-center rounded-lg ${stat.bgColor}`}
              >
                <stat.icon className={`size-5 ${stat.color}`} />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm font-medium text-gray-700">{stat.title}</p>
              <p className="text-xs text-gray-500">{stat.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">
          Primeiros Passos
        </h3>
        <ol className="mt-4 space-y-3 text-sm text-gray-600">
          <li className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-800">
              1
            </span>
            Cadastre sua propriedade em{" "}
            <a href="/areas" className="font-medium text-emerald-600 underline">
              Topologia / Áreas
            </a>
          </li>
          <li className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-800">
              2
            </span>
            Crie glebas, talhões e canteiros
          </li>
          <li className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-800">
              3
            </span>
            Registre itens de estoque e transações
          </li>
        </ol>
      </div>
    </div>
  );
}
