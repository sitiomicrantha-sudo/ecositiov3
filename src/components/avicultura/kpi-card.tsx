import { type LucideIcon } from "lucide-react";

interface KpiCardProps {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  value: string;
  subtitle?: string;
  badge?: {
    text: string;
    color: "green" | "amber" | "red" | "blue" | "gray";
  };
  infoText?: string;
}

const colorMap: Record<string, { bg: string; icon: string; badge: string }> = {
  green: { bg: "bg-green-50", icon: "text-green-600", badge: "bg-green-100 text-green-800" },
  amber: { bg: "bg-amber-50", icon: "text-amber-600", badge: "bg-amber-100 text-amber-800" },
  red: { bg: "bg-red-50", icon: "text-red-600", badge: "bg-red-100 text-red-800" },
  blue: { bg: "bg-blue-50", icon: "text-blue-600", badge: "bg-blue-100 text-blue-800" },
  gray: { bg: "bg-gray-50", icon: "text-gray-600", badge: "bg-gray-100 text-gray-800" },
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", badge: "bg-emerald-100 text-emerald-800" },
};

export function KpiCard({ icon: Icon, iconColor, title, value, subtitle, badge, infoText }: KpiCardProps) {
  const colors = colorMap[iconColor] || colorMap.gray;

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className={`flex size-10 items-center justify-center rounded-lg ${colors.bg}`}>
          <Icon className={`size-5 ${colors.icon}`} />
        </div>
        {badge && (
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorMap[badge.color]?.badge || colors.badge}`}>
            {badge.text}
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-700">{title}</p>
      {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
      {infoText && <p className="mt-2 text-xs text-gray-400">{infoText}</p>}
    </div>
  );
}
