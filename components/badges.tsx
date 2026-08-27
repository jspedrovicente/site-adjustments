import { cn } from "@/lib/utils";

const base = "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold";

export function PriorityBadge({ value }: { value: string }) {
  const key = value.toLowerCase();
  const color = key.includes("alta")
    ? "border-rose-400/30 bg-rose-400/10 text-rose-200"
    : key.includes("média") || key.includes("media")
      ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
      : key.includes("baixa")
        ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
        : "border-slate-500/40 bg-slate-500/10 text-slate-300";
  return <span className={cn(base, color)}>{value}</span>;
}

export function StatusBadge({ value }: { value: string }) {
  const key = value.toLowerCase();
  const color = key.includes("aprov") || key.includes("concl")
    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
    : key.includes("andamento") || key.includes("validar")
      ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
      : key.includes("corrigir") || key.includes("reprov")
        ? "border-rose-400/30 bg-rose-400/10 text-rose-200"
        : "border-slate-500/40 bg-slate-500/10 text-slate-300";
  return <span className={cn(base, color)}>{value}</span>;
}
