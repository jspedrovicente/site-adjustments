import Link from "next/link";
import { BadgeCheck, CheckCircle2, ClipboardList, Clock3, ListChecks, ShieldCheck, Star, UserRound } from "lucide-react";
import { getDemands } from "@/lib/data/demands";
import { isDemandAwaitingConfirmation, isDemandDone, isDemandDraft, isDemandPendingAnalysis, isDemandPostGoLive, isDemandRejected, isItemDone, type Demand, type DemandItem } from "@/lib/data/model";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Dashboard" };
const knownMembers = ["Vitor Moraes", "Lauro", "José", "Marco", "Elvis", "Wanderson", "João Guimarães"];

type Assignment = { kind: "demand" | "item" | "analysis" | "confirmation"; demand: Demand; item?: DemandItem; label: string; href?: string };
type AssignedDemand = { demand: Demand; assignees: string[]; pendingItems: number };
type PriorityBucket = "alta" | "media" | "baixa" | "undefined";

const normalizedPriority = (demand: Demand) => demand.priority.trim().toLocaleLowerCase("pt-BR");
const priorityBucket = (demand: Demand): PriorityBucket => {
  const priority = normalizedPriority(demand);
  if (priority === "alta") return "alta";
  if (priority === "média" || priority === "media") return "media";
  if (priority === "baixa") return "baixa";
  return "undefined";
};
const priorityRank = (demand: Demand) => {
  const rank: Record<PriorityBucket, number> = { alta: 0, media: 1, baixa: 2, undefined: 3 };
  return rank[priorityBucket(demand)];
};

export default async function DashboardPage() {
  const demands = await getDemands();
  const approvedDemands = demands.filter((demand) => !isDemandPendingAnalysis(demand) && !isDemandPostGoLive(demand) && !isDemandRejected(demand) && !isDemandDraft(demand));
  const activeDemands = approvedDemands.filter((demand) => !isDemandDone(demand) && !isDemandAwaitingConfirmation(demand));
  const completedDemands = approvedDemands.filter((demand) => isDemandDone(demand) || isDemandAwaitingConfirmation(demand));
  const activeItems = activeDemands.flatMap((demand) => demand.items);
  const completedItems = approvedDemands.flatMap((demand) => demand.items).filter(isItemDone);
  const stats = [
    { label: "Demandas em execução", value: activeDemands.length, icon: ClipboardList },
    { label: "Alta prioridade ativa", value: activeDemands.filter((demand) => priorityBucket(demand) === "alta").length, icon: Star },
    { label: "Itens pendentes", value: activeItems.filter((item) => !isItemDone(item)).length, icon: Clock3 },
    { label: "Itens concluídos", value: completedItems.length, icon: CheckCircle2 },
    { label: "Pendentes de análise", value: demands.filter(isDemandPendingAnalysis).length, icon: ShieldCheck },
    { label: "Pendentes de confirmação", value: approvedDemands.filter(isDemandAwaitingConfirmation).length, icon: BadgeCheck },
  ];
  const categories = Object.entries(approvedDemands.reduce<Record<string, number>>((result, demand) => {
    const key = demand.category?.name ?? "Sem categoria";
    result[key] = (result[key] ?? 0) + 1;
    return result;
  }, {})).sort((a, b) => b[1] - a[1]);
  const priorityCounts = activeDemands.reduce((result, demand) => {
    const value = normalizedPriority(demand);
    if (value === "alta") result.alta += 1;
    else if (value === "média" || value === "media") result.media += 1;
    else if (value === "baixa") result.baixa += 1;
    else result.undefined += 1;
    return result;
  }, { alta: 0, media: 0, baixa: 0, undefined: 0 });
  const assignedDemands = activeDemands.map((demand): AssignedDemand => {
    const pendingItems = demand.items.filter((item) => !isItemDone(item));
    const assignees = [...new Set([
      demand.developer,
      ...pendingItems.map((item) => item.assignee),
    ].filter((name): name is string => !!name?.trim()))];
    return { demand, assignees, pendingItems: pendingItems.length };
  }).filter(({ assignees }) => assignees.length > 0).sort((a, b) => priorityRank(a.demand) - priorityRank(b.demand) || a.demand.title.localeCompare(b.demand.title, "pt-BR"));
  const highPriorityAssignments = assignedDemands.filter(({ demand }) => normalizedPriority(demand) === "alta");
  const otherPriorityAssignments = assignedDemands.filter(({ demand }) => normalizedPriority(demand) !== "alta");
  const completedByPriority: Record<PriorityBucket, Demand[]> = { alta: [], media: [], baixa: [], undefined: [] };
  completedDemands.sort((a, b) => a.title.localeCompare(b.title, "pt-BR")).forEach((demand) => completedByPriority[priorityBucket(demand)].push(demand));
  const names = [...new Set([...knownMembers, ...approvedDemands.flatMap((demand) => [demand.developer, ...demand.items.map((item) => item.assignee)]).filter((value): value is string => !!value)])];
  const assignments = new Map<string, Assignment[]>(names.map((name) => [name, []]));
  demands.filter(isDemandPendingAnalysis).forEach((demand) => assignments.get("Marco")?.push({ kind: "analysis", demand, label: "Pendente de análise", href: "/approvals" }));
  approvedDemands.filter(isDemandAwaitingConfirmation).forEach((demand) => assignments.get("João Guimarães")?.push({ kind: "confirmation", demand, label: "Pendente de confirmação", href: "/confirmations" }));
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
      <section><div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="font-mono text-xs font-semibold uppercase tracking-wide text-emerald-700">Histórico de entrega</p><h2 className="mt-1 text-xl font-semibold text-slate-950">Tudo o que já foi trabalhado</h2><p className="mt-1 max-w-3xl text-sm text-slate-500">Inclui demandas finalizadas e demandas com todos os itens concluídos que estão aguardando confirmação.</p></div><div className="flex gap-2"><span className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">{completedDemands.length} demandas</span><span className="rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800">{completedDemands.reduce((total, demand) => total + demand.items.length, 0)} itens</span></div></div><div className="grid items-start gap-4 lg:grid-cols-2 2xl:grid-cols-4"><CompletedPriorityGroup label="Alta" demands={completedByPriority.alta} tone="high"/><CompletedPriorityGroup label="Média" demands={completedByPriority.media} tone="medium"/><CompletedPriorityGroup label="Baixa" demands={completedByPriority.baixa} tone="low"/><CompletedPriorityGroup label="Não definida" demands={completedByPriority.undefined} tone="undefined"/></div></section>
      <section className="panel rounded-xl p-5"><div className="mb-4"><h2 className="text-base font-semibold text-white">Demandas ativas por prioridade</h2><p className="mt-1 text-xs text-slate-400">Somente demandas que ainda exigem trabalho; concluídas e pendentes de confirmação ficam de fora.</p></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><PriorityStat label="Alta" value={priorityCounts.alta} className="border-rose-400/25 bg-rose-400/5 text-rose-200"/><PriorityStat label="Média" value={priorityCounts.media} className="border-amber-400/25 bg-amber-400/5 text-amber-200"/><PriorityStat label="Baixa" value={priorityCounts.baixa} className="border-cyan-400/25 bg-cyan-400/5 text-cyan-200"/><PriorityStat label="Não definida" value={priorityCounts.undefined} className="border-slate-500/30 bg-slate-500/5 text-slate-300"/></div></section>
      <section><div className="mb-3"><h2 className="text-base font-semibold text-slate-950">Trabalho ativo atribuído por prioridade</h2><p className="mt-1 text-xs text-slate-500">Todas as demandas em andamento com responsável na demanda ou em pelo menos um item pendente.</p></div><div className="grid items-start gap-4 xl:grid-cols-2"><AssignedPriorityGroup title="Prioridade alta" assignments={highPriorityAssignments} tone="high"/><AssignedPriorityGroup title="Demais prioridades" assignments={otherPriorityAssignments} tone="other"/></div></section>
      <div className="grid gap-8 xl:grid-cols-[minmax(240px,1fr)_minmax(0,3fr)]">
        <section><h2 className="mb-3 text-base font-semibold text-slate-950">Demandas por categoria</h2><div className="panel divide-y rounded-lg">{categories.length ? categories.map(([name, count]) => <div key={name} className="flex items-center justify-between px-4 py-3 text-sm"><span>{name}</span><span className="font-semibold">{count}</span></div>) : <p className="p-5 text-sm text-slate-500">Nenhuma categoria encontrada.</p>}</div></section>
        <section><div className="mb-3 flex items-center justify-between"><h2 className="text-base font-semibold text-slate-950">Atribuição por membro da equipe</h2><span className="text-xs text-slate-500">Somente trabalhos pendentes</span></div><div className="grid items-start gap-4 lg:grid-cols-2">{names.map((name) => <MemberAssignments key={name} name={name} assignments={assignments.get(name) ?? []}/>)}</div></section>
      </div>
    </div>
  </>;
}

function PriorityStat({ label, value, className }: { label: string; value: number; className: string }) { return <div className={`flex items-center justify-between rounded-lg border px-4 py-3 ${className}`}><span className="font-mono text-xs font-semibold uppercase tracking-wide">{label}</span><strong className="text-2xl text-white">{value}</strong></div>; }

function CompletedPriorityGroup({ label, demands, tone }: { label: string; demands: Demand[]; tone: "high" | "medium" | "low" | "undefined" }) {
  const tones = {
    high: "border-rose-300 bg-rose-50 text-rose-800",
    medium: "border-amber-300 bg-amber-50 text-amber-800",
    low: "border-cyan-300 bg-cyan-50 text-cyan-800",
    undefined: "border-slate-300 bg-slate-50 text-slate-700",
  };
  const itemCount = demands.reduce((total, demand) => total + demand.items.length, 0);
  return <details className="panel group overflow-hidden rounded-xl"><summary className={`flex cursor-pointer list-none items-center justify-between border-b px-4 py-3 marker:hidden ${tones[tone]}`}><div><p className="font-mono text-xs font-semibold uppercase tracking-wide">{label}</p><p className="mt-1 text-xs opacity-75">{demands.length} demandas · {itemCount} itens</p></div><span className="text-lg transition group-open:rotate-180">⌄</span></summary><div className="max-h-[30rem] overflow-y-auto border-t border-slate-700/60">{demands.length ? <div className="divide-y divide-slate-700/60">{demands.map((demand) => <Link key={demand.id} href={`/demands/${demand.id}`} className="block px-4 py-3 transition hover:bg-white/5"><div className="flex items-start justify-between gap-3"><p className="min-w-0 text-sm font-medium text-slate-100">{demand.title}</p><span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${isDemandDone(demand) ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" : "border-violet-400/25 bg-violet-400/10 text-violet-200"}`}>{isDemandDone(demand) ? "Finalizada" : "Confirmação"}</span></div><p className="mt-1 text-xs text-slate-400">{demand.items.length} {demand.items.length === 1 ? "item" : "itens"} · {demand.category?.name ?? "Sem categoria"}</p></Link>)}</div> : <p className="px-4 py-6 text-center text-sm text-slate-400">Nenhuma entrega nesta prioridade</p>}</div></details>;
}

function AssignedPriorityGroup({ title, assignments, tone }: { title: string; assignments: AssignedDemand[]; tone: "high" | "other" }) {
  const headerTone = tone === "high" ? "border-rose-400/25 bg-rose-400/10 text-rose-100" : "border-amber-400/20 bg-amber-400/[.07] text-amber-100";
  return <section className="panel overflow-hidden rounded-xl"><div className={`flex items-center justify-between border-b px-4 py-3 ${headerTone}`}><h3 className="text-sm font-semibold">{title}</h3><span className="rounded-full border border-current/20 px-2.5 py-1 text-xs font-semibold">{assignments.length}</span></div>{assignments.length ? <div className="divide-y divide-slate-700/60">{assignments.map(({ demand, assignees, pendingItems }) => <Link key={demand.id} href={`/demands/${demand.id}`} className="block px-4 py-3 transition hover:bg-white/5"><div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-100">{demand.title}</p><p className="mt-1 text-xs text-slate-400">{demand.category?.name ?? "Sem categoria"} · {pendingItems} {pendingItems === 1 ? "item pendente" : "itens pendentes"}</p></div><span className="shrink-0 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-300">{demand.priority}</span></div><p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-violet-200"><UserRound className="size-3.5"/>{assignees.join(", ")}</p></Link>)}</div> : <p className="px-4 py-6 text-center text-sm text-slate-400">Nenhuma demanda atribuída</p>}</section>;
}

function MemberAssignments({ name, assignments }: { name: string; assignments: Assignment[] }) {
  const queues = assignments.filter((assignment) => assignment.kind === "analysis" || assignment.kind === "confirmation");
  const demands = assignments.filter((assignment) => assignment.kind === "demand");
  const items = assignments.filter((assignment) => assignment.kind === "item");
  const visible = [...queues, ...demands, ...items].slice(0, 5);
  return <details className="panel group overflow-hidden rounded-xl"><summary className="flex cursor-pointer list-none items-center justify-between bg-slate-950/25 px-4 py-3 marker:hidden"><h3 className="flex items-center gap-2 text-sm font-semibold text-white"><span className="grid size-8 place-items-center rounded-full border border-violet-400/20 bg-violet-400/10 text-violet-200"><UserRound className="size-4"/></span>{name}</h3><div className="flex items-center gap-3"><span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-xs font-semibold text-cyan-200">{assignments.length}</span><span className="text-lg text-slate-400 transition group-open:rotate-180">⌄</span></div></summary><div className="border-t border-slate-700/60">{assignments.length ? <div className="divide-y divide-slate-700/60">{visible.map((assignment) => <AssignmentRow key={`${assignment.kind}-${assignment.demand.id}-${assignment.item?.id ?? "queue"}`} assignment={assignment}/>)}{assignments.length > 5 && <p className="bg-slate-950/20 px-4 py-2.5 text-center text-xs font-medium text-slate-400">+ {assignments.length - 5} atribuições não exibidas</p>}</div> : <p className="px-4 py-6 text-center text-sm text-slate-400">Nenhuma atribuição pendente</p>}</div></details>;
}

function AssignmentRow({ assignment }: { assignment: Assignment }) {
  const item = assignment.item;
  const queue = assignment.kind === "analysis" || assignment.kind === "confirmation";
  const badge = assignment.kind === "analysis" ? "Análise" : assignment.kind === "confirmation" ? "Confirmação" : assignment.kind === "demand" ? "Demanda" : assignment.label;
  const color = assignment.kind === "analysis" ? "border-violet-400/20 bg-violet-400/10 text-violet-200" : assignment.kind === "confirmation" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : assignment.kind === "demand" ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-200" : "border-amber-400/20 bg-amber-400/10 text-amber-200";
  return <Link href={assignment.href ?? `/demands/${assignment.demand.id}`} className="block px-4 py-3 transition hover:bg-white/5"><div className="flex items-center gap-2"><span className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase ${color}`}>{badge}</span><span className="truncate text-xs text-slate-400">{assignment.demand.category?.name}</span></div><p className="mt-1.5 truncate text-sm font-medium text-slate-100">{assignment.kind === "item" ? item?.description : assignment.demand.title}</p>{assignment.kind === "item" && <p className="mt-1 flex items-center gap-1 text-xs text-slate-400"><ListChecks className="size-3"/>{assignment.demand.title}</p>}{queue && <p className="mt-1 text-xs text-slate-400">Abrir fila de {assignment.kind === "analysis" ? "análise" : "confirmação"} →</p>}</Link>;
}
