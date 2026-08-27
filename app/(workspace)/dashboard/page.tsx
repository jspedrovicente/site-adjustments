import Link from "next/link";
import { BadgeCheck, CheckCircle2, ClipboardList, Clock3, ListChecks, ShieldCheck, Star, UserRound } from "lucide-react";
import { getDemands } from "@/lib/data/demands";
import { isDemandAwaitingConfirmation, isDemandDone, isDemandPendingAnalysis, isItemDone, type Demand, type DemandItem } from "@/lib/data/model";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Dashboard" };
const knownDevelopers = ["Vitor Moraes", "Lauro", "José", "Marco", "Elvis", "Wanderson"];

type Assignment = { kind: "demand" | "item"; demand: Demand; item?: DemandItem; label: string };

export default async function DashboardPage() {
  const demands = await getDemands();
  const approvedDemands = demands.filter((demand) => !isDemandPendingAnalysis(demand));
  const items = approvedDemands.flatMap((demand) => demand.items);
  const stats = [
    { label: "Total de demandas", value: approvedDemands.length, icon: ClipboardList },
    { label: "Itens pendentes", value: items.filter((item) => !isItemDone(item)).length, icon: Clock3 },
    { label: "Itens importantes", value: items.filter((item) => item.annotations.some((annotation) => annotation.semantic === "important")).length, icon: Star },
    { label: "Pendentes de análise", value: demands.filter(isDemandPendingAnalysis).length, icon: ShieldCheck },
    { label: "Pendentes de confirmação", value: approvedDemands.filter(isDemandAwaitingConfirmation).length, icon: BadgeCheck },
    { label: "Concluídos", value: approvedDemands.filter(isDemandDone).length, icon: CheckCircle2 },
  ];
  const categories = Object.entries(approvedDemands.reduce<Record<string, number>>((result, demand) => {
    const key = demand.category?.name ?? "Sem categoria";
    result[key] = (result[key] ?? 0) + 1;
    return result;
  }, {})).sort((a, b) => b[1] - a[1]);
  const priorityCounts = approvedDemands.reduce((result, demand) => {
    const value = demand.priority.trim().toLocaleLowerCase("pt-BR");
    if (value === "alta") result.alta += 1;
    else if (value === "média" || value === "media") result.media += 1;
    else if (value === "baixa") result.baixa += 1;
    else result.undefined += 1;
    return result;
  }, { alta: 0, media: 0, baixa: 0, undefined: 0 });
  const names = [...new Set([...knownDevelopers, ...approvedDemands.flatMap((demand) => [demand.developer, ...demand.items.map((item) => item.assignee)]).filter((value): value is string => !!value)])];
  const assignments = new Map<string, Assignment[]>(names.map((name) => [name, []]));
  for (const demand of approvedDemands) {
    if (demand.developer && !isDemandDone(demand) && !isDemandAwaitingConfirmation(demand)) assignments.get(demand.developer)?.push({ kind: "demand", demand, label: demand.title });
    demand.items.forEach((item, index) => {
      if (item.assignee && !isItemDone(item)) assignments.get(item.assignee)?.push({ kind: "item", demand, item, label: `Item ${item.number ?? index + 1}` });
    });
  }

  return <>
    <PageHeader eyebrow="Visão geral" title="Dashboard" description="Acompanhe o volume de trabalho e as atribuições da equipe." actions={<Link href="/demands" className="focus-ring rounded-md bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">Ver demandas</Link>}/>
    <div className="space-y-8 p-5 sm:p-8 lg:p-10">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">{stats.map(({ label, value, icon: Icon }) => <div key={label} className="panel rounded-lg p-5"><Icon className="size-5 text-blue-700"/><p className="mt-5 text-3xl font-semibold text-slate-950">{value}</p><p className="mt-1 text-sm text-slate-500">{label}</p></div>)}</section>
      <section className="panel rounded-lg p-5"><div className="mb-4"><h2 className="text-base font-semibold text-slate-950">Demandas por prioridade</h2><p className="mt-1 text-xs text-slate-500">Distribuição das demandas aprovadas</p></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><PriorityStat label="Alta" value={priorityCounts.alta} className="border-red-200 bg-red-50 text-red-700"/><PriorityStat label="Média" value={priorityCounts.media} className="border-amber-200 bg-amber-50 text-amber-800"/><PriorityStat label="Baixa" value={priorityCounts.baixa} className="border-blue-200 bg-blue-50 text-blue-700"/><PriorityStat label="Não definida" value={priorityCounts.undefined} className="border-slate-200 bg-slate-50 text-slate-600"/></div></section>
      <div className="grid gap-8 xl:grid-cols-[minmax(240px,1fr)_minmax(0,3fr)]">
        <section><h2 className="mb-3 text-base font-semibold text-slate-950">Demandas por categoria</h2><div className="panel divide-y rounded-lg">{categories.length ? categories.map(([name, count]) => <div key={name} className="flex items-center justify-between px-4 py-3 text-sm"><span>{name}</span><span className="font-semibold">{count}</span></div>) : <p className="p-5 text-sm text-slate-500">Nenhuma categoria encontrada.</p>}</div></section>
        <section><div className="mb-3 flex items-center justify-between"><h2 className="text-base font-semibold text-slate-950">Atribuições por desenvolvedor</h2><span className="text-xs text-slate-500">Somente trabalhos pendentes</span></div><div className="grid gap-4 lg:grid-cols-2">{names.map((name) => <DeveloperAssignments key={name} name={name} assignments={assignments.get(name) ?? []}/>)}</div></section>
      </div>
    </div>
  </>;
}

function PriorityStat({ label, value, className }: { label: string; value: number; className: string }) { return <div className={`flex items-center justify-between rounded-md border px-4 py-3 ${className}`}><span className="text-sm font-semibold">{label}</span><strong className="text-2xl">{value}</strong></div>; }

function DeveloperAssignments({ name, assignments }: { name: string; assignments: Assignment[] }) {
  const demands = assignments.filter((assignment) => assignment.kind === "demand");
  const items = assignments.filter((assignment) => assignment.kind === "item");
  const visible = [...demands, ...items].slice(0, 5);
  return <details className="panel group overflow-hidden rounded-lg"><summary className="flex cursor-pointer list-none items-center justify-between bg-slate-50 px-4 py-3 marker:hidden"><h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><span className="grid size-8 place-items-center rounded-full bg-violet-100 text-violet-700"><UserRound className="size-4"/></span>{name}</h3><div className="flex items-center gap-3"><span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">{assignments.length}</span><span className="text-lg text-slate-400 transition group-open:rotate-180">⌄</span></div></summary><div className="border-t">{assignments.length ? <div className="divide-y">{visible.map((assignment) => <AssignmentRow key={assignment.kind === "demand" ? `d-${assignment.demand.id}` : `i-${assignment.item?.id}`} assignment={assignment}/>)}{assignments.length > 5 && <p className="bg-slate-50 px-4 py-2.5 text-center text-xs font-medium text-slate-500">+ {assignments.length - 5} atribuições não exibidas</p>}</div> : <p className="px-4 py-6 text-center text-sm text-slate-400">Nenhuma atribuição pendente</p>}</div></details>;
}

function AssignmentRow({ assignment }: { assignment: Assignment }) {
  const item = assignment.item;
  return <Link href={`/demands/${assignment.demand.id}`} className="block px-4 py-3 hover:bg-slate-50"><div className="flex items-center gap-2"><span className={`rounded px-2 py-0.5 text-[11px] font-semibold uppercase ${assignment.kind === "demand" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>{assignment.kind === "demand" ? "Demanda" : assignment.label}</span><span className="truncate text-xs text-slate-400">{assignment.demand.category?.name}</span></div><p className="mt-1.5 truncate text-sm font-medium text-slate-800">{assignment.kind === "demand" ? assignment.demand.title : item?.description}</p>{assignment.kind === "item" && <p className="mt-1 flex items-center gap-1 text-xs text-slate-400"><ListChecks className="size-3"/>{assignment.demand.title}</p>}</Link>;
}
