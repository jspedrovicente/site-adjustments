import Link from "next/link";
import { CalendarDays, CheckCircle2, CircleHelp, ImageIcon, Star, Tag, UserRound } from "lucide-react";
import { isDemandDone, isItemDone, type Demand } from "@/lib/data/model";
import { PriorityBadge, StatusBadge } from "./badges";

const date = (value?: string) => value ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)) : "—";

export function DemandCard({ demand }: { demand: Demand }) {
  const questions = demand.items.filter((item) => item.type === "question").length;
  const images = demand.items.reduce((sum, item) => sum + item.attachments.length, 0);
  const important = demand.items.filter((item) => item.annotations.some((annotation) => annotation.semantic === "important")).length;
  const done = demand.items.filter(isItemDone).length;
  const labeledItems = demand.items.map((item, index) => ({ item, label: item.number ?? String(index + 1) }));
  const pendingItems = labeledItems.filter(({ item }) => !isItemDone(item));
  const untaggedItems = pendingItems.filter(({ item }) => item.annotations.length === 0);
  const completed = isDemandDone(demand);

  return <Link href={`/demands/${demand.id}`} className="panel focus-ring block rounded-lg p-5 transition hover:border-slate-300 hover:shadow-md">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div><div className="mb-2 flex flex-wrap items-center gap-2"><span className="text-xs font-medium text-blue-700">{demand.category?.name ?? "Sem categoria"}</span>{demand.sourceId && <span className="text-xs text-slate-400">#{demand.sourceId}</span>}{completed && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white"><CheckCircle2 className="size-3.5"/>Demanda concluída</span>}</div><h2 className="font-semibold text-slate-950">{demand.title}</h2></div>
      <div className="flex shrink-0 gap-2"><PriorityBadge value={demand.priority}/><StatusBadge value={demand.status}/></div>
    </div>

    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
      <span className="flex items-center gap-1.5"><UserRound className="size-4"/>{demand.developer ?? "Não atribuído"}</span>
      <span className="flex items-center gap-1.5"><CircleHelp className="size-4"/>{demand.items.length} itens · {questions} dúvidas</span>
      <span className="flex items-center gap-1.5"><ImageIcon className="size-4"/>{images} imagens</span>
      <span className="flex items-center gap-1.5"><CalendarDays className="size-4"/>{date(demand.updatedAt)}</span>
    </div>

    <div className="mt-3 flex flex-wrap items-center gap-2">
      <CountBadge icon={<Star className="size-3.5"/>} label="Importantes" count={important} className="border-blue-200 bg-blue-50 text-blue-700"/>
      <CountBadge icon={<CheckCircle2 className="size-3.5"/>} label="Feitos" count={done} className="border-emerald-200 bg-emerald-50 text-emerald-700"/>
      <CountBadge icon={<Tag className="size-3.5"/>} label="Sem tags" count={untaggedItems.length} className="border-slate-200 bg-slate-50 text-slate-600"/>
      {untaggedItems.length > 0 && <span className="text-xs font-medium text-slate-500">Itens: <strong className="text-slate-700">{untaggedItems.slice(0, 8).map(({ label }) => label).join(", ")}</strong>{untaggedItems.length > 8 && ` +${untaggedItems.length - 8}`}</span>}
    </div>

    {pendingItems.length > 0 && <section className="mt-4 border-t pt-4"><div className="mb-2 flex items-center justify-between"><h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Itens pendentes</h3><span className="text-xs font-semibold text-slate-500">{pendingItems.length}</span></div><div className="space-y-1.5">{pendingItems.slice(0, 5).map(({ item, label }) => <div key={item.id} className="grid gap-1 rounded-md border bg-slate-50 px-3 py-2 text-xs sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><p className="min-w-0 truncate text-slate-700"><strong className="mr-1.5 text-slate-950">Item {label}</strong>{item.description}</p><span className={item.assignee ? "inline-flex items-center gap-1 font-semibold text-violet-700" : "text-slate-400"}><UserRound className="size-3.5"/>{item.assignee ?? "Sem responsável"}</span></div>)}{pendingItems.length > 5 && <p className="px-1 pt-1 text-xs font-medium text-slate-500">+ {pendingItems.length - 5} itens pendentes</p>}</div></section>}
  </Link>;
}

function CountBadge({ icon, label, count, className }: { icon: React.ReactNode; label: string; count: number; className: string }) { return <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${className}`}>{icon}<strong>{count}</strong> {label}</span>; }
