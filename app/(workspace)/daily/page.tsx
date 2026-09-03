import Link from "next/link";
import { AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, CircleDot, FilePlus2, UserRound } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getDemands } from "@/lib/data/demands";
import { isDemandDraft, type Demand, type DemandItem, type ItemResolution } from "@/lib/data/model";

export const metadata = { title: "Daily da equipe" };
const DAY = 86_400_000;
const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const shortDate = (date: Date) => date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
const isDuring = (value: string | undefined, from: Date, to: Date) => !!value && new Date(value) >= from && new Date(value) < to;
const resolutionMeta: Record<ItemResolution, { label: string; classes: string }> = {
  pending: { label: "Pendentes", classes: "border-cyan-400/20 bg-cyan-400/10 text-cyan-200" },
  done: { label: "Completos", classes: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" },
  done_with_caveats: { label: "Com ressalvas", classes: "border-amber-400/20 bg-amber-400/10 text-amber-200" },
  business_rule_conflict: { label: "Conflitos de regra", classes: "border-rose-400/20 bg-rose-400/10 text-rose-200" },
  future_version: { label: "Versão futura", classes: "border-violet-400/20 bg-violet-400/10 text-violet-200" },
};

export default async function DailyPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date } = await searchParams;
  const today = startOfDay(new Date());
  const defaultMeeting = new Date(today.getTime() + DAY);
  const requested = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? startOfDay(new Date(`${date}T12:00:00`)) : defaultMeeting;
  const meetingDate = requested.getTime() > defaultMeeting.getTime() ? defaultMeeting : requested;
  const activityDate = new Date(meetingDate.getTime() - DAY);
  const activityEnd = new Date(activityDate.getTime() + DAY);
  const dailyButtons = Array.from({ length: 7 }, (_, index) => new Date(defaultMeeting.getTime() - index * DAY));

  const demands = await getDemands();
  const newDemands = demands.filter((demand) => !isDemandDraft(demand) && isDuring(demand.createdAt, activityDate, activityEnd));
  const changedDemands = demands.filter((demand) => !isDemandDraft(demand)).map((demand) => ({ demand, items: demand.items.filter((item) => isDuring(item.updatedAt, activityDate, activityEnd) && !isDuring(item.createdAt, activityDate, activityEnd)) })).filter(({ items }) => items.length);
  const workByDeveloper = new Map<string, { demand: Demand; items: DemandItem[] }[]>();
  for (const { demand, items } of changedDemands) {
    const names = [...new Set(items.map((item) => item.assignee ?? demand.developer ?? "Sem responsável"))];
    for (const name of names) {
      const assignedItems = items.filter((item) => (item.assignee ?? demand.developer ?? "Sem responsável") === name);
      workByDeveloper.set(name, [...(workByDeveloper.get(name) ?? []), { demand, items: assignedItems }]);
    }
  }
  const changedItems = changedDemands.flatMap(({ items }) => items);
  const completed = changedItems.filter((item) => item.resolution !== "pending").length;
  const blockers = changedItems.filter((item) => item.resolution === "business_rule_conflict").length;
  const attentionDemands = changedDemands.map(({ demand, items }) => ({ demand, items: items.filter((item) => item.resolution !== "done" && item.resolution !== "pending") })).filter(({ items }) => items.length);

  return <>
    <PageHeader eyebrow={`Daily ${shortDate(meetingDate)}`} title="Daily da equipe" description={`Resumo do trabalho realizado em ${activityDate.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}.`} />
    <main className="space-y-8 p-5 sm:p-8 lg:p-10">
      <nav aria-label="Selecionar daily" className="panel overflow-x-auto rounded-xl p-2"><div className="flex min-w-max gap-2">{dailyButtons.map((buttonDate) => <Link key={dateKey(buttonDate)} href={`/daily?date=${dateKey(buttonDate)}`} className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${dateKey(buttonDate) === dateKey(meetingDate) ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-950/30" : "bg-slate-950/25 text-slate-300 hover:bg-white/5 hover:text-white"}`}>Daily {shortDate(buttonDate)}</Link>)}</div></nav>

      <section className="panel rounded-xl p-6 sm:p-8"><p className="font-mono text-xs font-semibold uppercase tracking-[.16em] text-violet-300">Daily do Comercial</p><h2 className="mt-2 max-w-4xl text-2xl font-semibold leading-tight text-white">Ontem tivemos progresso em <span className="text-cyan-300">{changedItems.length} {changedItems.length === 1 ? "item" : "itens"}</span>, distribuídos por {changedDemands.length} {changedDemands.length === 1 ? "demanda" : "demandas"}.</h2><p className="mt-3 text-sm text-slate-400">{completed} itens receberam um encaminhamento e {attentionDemands.reduce((total, update) => total + update.items.length, 0)} precisam de conversa nesta daily.</p></section>

      <Attention updates={attentionDemands} />

      <section className="grid gap-3 sm:grid-cols-3">
        <Stat icon={FilePlus2} value={newDemands.length} label="Novas demandas" note="criadas por João" tone="cyan" />
        <Stat icon={CheckCircle2} value={completed} label="Itens encaminhados" note={`de ${changedItems.length} alterados`} tone="emerald" />
        <Stat icon={AlertTriangle} value={blockers} label="Conflitos de regra" note="precisam de decisão" tone="amber" />
      </section>

      {newDemands.length > 0 && <Summary title="Novas demandas criadas por João" icon={FilePlus2} count={newDemands.length}>{newDemands.map((demand) => <DemandLink key={demand.id} demand={demand} />)}</Summary>}

      <section className="space-y-7"><div><p className="font-mono text-xs font-semibold uppercase tracking-[.15em] text-cyan-300">Pauta por pessoa</p><h2 className="mt-1 text-xl font-semibold text-white">Atividades da equipe</h2><p className="mt-1 text-sm text-slate-400">Resumo das entregas, alterações e pontos de atenção desde a última daily.</p></div>{workByDeveloper.size ? [...workByDeveloper.entries()].sort(([a], [b]) => a.localeCompare(b, "pt-BR")).map(([name, updates]) => <DeveloperUpdates key={name} name={name} updates={updates} />) : <Empty />}</section>
    </main>
  </>;
}

function Attention({ updates }: { updates: { demand: Demand; items: DemandItem[] }[] }) {
  const total = updates.reduce((sum, update) => sum + update.items.length, 0);
  return <section className="overflow-hidden rounded-xl border border-amber-400/25 bg-amber-400/[.06] shadow-lg shadow-amber-950/10">
    <div className="flex items-center justify-between border-b border-amber-400/15 px-5 py-4"><div><p className="font-mono text-xs font-semibold uppercase tracking-[.16em] text-amber-300">Pontos de atenção</p><h2 className="mt-1 text-lg font-semibold text-white">Assuntos que precisam ser discutidos</h2></div><span className="rounded-full bg-amber-400/10 px-3 py-1 text-sm font-semibold text-amber-200">{total}</span></div>
    {updates.length ? <div className="divide-y divide-amber-400/15">{updates.map(({ demand, items }) => <div key={demand.id} className="p-5"><Link href={`/demands/${demand.id}`} className="group flex items-center justify-between gap-3"><h3 className="font-semibold text-white group-hover:text-amber-200">{demand.title}</h3><ArrowRight className="size-4 shrink-0 text-amber-300"/></Link><div className="mt-3 grid gap-3 lg:grid-cols-2">{items.map((item) => <div key={item.id} className="rounded-lg border border-slate-700/60 bg-[#1e2439] p-4"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-md border px-2 py-1 text-[11px] font-semibold ${resolutionMeta[item.resolution].classes}`}>{resolutionMeta[item.resolution].label}</span><span className="ml-auto flex items-center gap-1 text-xs text-slate-400"><UserRound className="size-3"/>{item.assignee ?? demand.developer ?? "Sem responsável"}</span></div><p className="mt-3 line-clamp-2 text-sm font-medium text-slate-100">{item.description}</p><div className="mt-3 rounded-md bg-slate-950/30 px-3 py-2 text-sm text-slate-300"><span className="font-semibold text-amber-200">Comentário do dev: </span>{item.developerResponse?.trim() || "Nenhum comentário foi registrado."}</div></div>)}</div></div>)}</div> : <p className="px-5 py-6 text-sm text-slate-400">Nenhum ponto de atenção nesta daily. Todos os itens discutidos foram concluídos sem ressalvas.</p>}
  </section>;
}

function DeveloperUpdates({ name, updates }: { name: string; updates: { demand: Demand; items: DemandItem[] }[] }) {
  const itemCount = updates.reduce((total, update) => total + update.items.length, 0);
  return <section className="space-y-3"><div className="flex items-center justify-between border-b border-slate-700/60 pb-3"><h3 className="flex items-center gap-2 text-lg font-semibold text-white"><span className="grid size-9 place-items-center rounded-full border border-violet-400/20 bg-violet-400/10 text-violet-200"><UserRound className="size-4"/></span>{name}</h3><span className="text-xs text-slate-400">{updates.length} {updates.length === 1 ? "demanda" : "demandas"} · {itemCount} {itemCount === 1 ? "item alterado" : "itens alterados"}</span></div>{updates.map(({ demand, items }) => <DemandUpdate key={`${name}-${demand.id}`} demand={demand} items={items} actor={name} />)}</section>;
}

function DemandUpdate({ demand, items, actor }: { demand: Demand; items: DemandItem[]; actor: string }) {
  const groups = (Object.keys(resolutionMeta) as ItemResolution[]).map((resolution) => ({ resolution, count: items.filter((item) => item.resolution === resolution).length })).filter(({ count }) => count);
  const assignees = [...new Set(items.map((item) => item.assignee).filter(Boolean))];
  const ownership = demand.developer && demand.developer !== actor ? `Demanda atribuída a ${demand.developer}; atividade realizada por ${actor}.` : undefined;
  const summaries = [...new Set([ownership, ...items.map((item) => item.developerResponse?.trim())].filter((value): value is string => !!value))].slice(0, 3);
  return <article className="panel overflow-hidden rounded-xl"><div className="p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-md border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-[11px] font-semibold uppercase text-cyan-200">{demand.status}</span><span className="text-xs text-slate-400">{demand.category?.name ?? "Sem categoria"}</span></div><Link href={`/demands/${demand.id}`} className="mt-2 block text-lg font-semibold text-white hover:text-cyan-200">{demand.title}</Link></div><p className="flex shrink-0 items-center gap-1 text-xs text-slate-400"><UserRound className="size-3"/>{assignees.length ? assignees.join(", ") : demand.developer ?? "Sem responsável"}</p></div><div className="mt-4 flex flex-wrap gap-2">{groups.map(({ resolution, count }) => <span key={resolution} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${resolutionMeta[resolution].classes}`}><strong className="mr-1 text-base">{count}</strong>{resolutionMeta[resolution].label}</span>)}</div><div className="mt-4 rounded-lg border border-slate-700/60 bg-slate-950/20 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Resumo do que mudou</p>{summaries.length ? <ul className="mt-2 space-y-1 text-sm text-slate-200">{summaries.map((summary) => <li key={summary}>• {summary}</li>)}</ul> : <p className="mt-2 text-sm text-slate-400">{items.length} {items.length === 1 ? "item foi atualizado" : "itens foram atualizados"}, sem observação adicional registrada.</p>}</div></div><Link href={`/demands/${demand.id}`} className="flex items-center justify-end gap-1 border-t border-slate-700/60 px-5 py-3 text-xs font-semibold text-cyan-300 hover:bg-white/[.03]">Ver detalhes <ArrowRight className="size-3"/></Link></article>;
}

function Stat({ icon: Icon, value, label, note, tone }: { icon: typeof CircleDot; value: number; label: string; note: string; tone: "cyan" | "violet" | "emerald" | "amber" }) { const colors = { cyan: "text-cyan-300 bg-cyan-400/10", violet: "text-violet-300 bg-violet-400/10", emerald: "text-emerald-300 bg-emerald-400/10", amber: "text-amber-300 bg-amber-400/10" }; return <div className="panel rounded-xl p-5"><div className="flex items-start justify-between"><span className={`rounded-lg p-2 ${colors[tone]}`}><Icon className="size-5"/></span><strong className="text-3xl text-white">{value}</strong></div><p className="mt-4 text-sm font-semibold text-slate-100">{label}</p><p className="mt-1 text-xs text-slate-400">{note}</p></div>; }
function Summary({ title, icon: Icon, count, children }: { title: string; icon: typeof CalendarDays; count: number; children: React.ReactNode }) { return <div className="panel overflow-hidden rounded-xl"><div className="flex items-center justify-between border-b border-slate-700/60 px-4 py-3"><h2 className="flex items-center gap-2 text-sm font-semibold text-white"><Icon className="size-4 text-violet-300"/>{title}</h2><span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-slate-300">{count}</span></div><div className="divide-y divide-slate-700/50">{count ? children : <p className="p-4 text-sm text-slate-400">Nenhuma nesta daily.</p>}</div></div>; }
function DemandLink({ demand }: { demand: Demand }) { return <Link href={`/demands/${demand.id}`} className="block p-4 hover:bg-white/[.03]"><p className="line-clamp-2 text-sm font-medium text-slate-100">{demand.title}</p><p className="mt-1 text-xs text-slate-400">{demand.developer ?? "Sem desenvolvedor"} · {demand.priority}</p></Link>; }
function Empty() { return <div className="panel rounded-xl px-6 py-14 text-center"><CalendarDays className="mx-auto size-8 text-slate-500"/><h3 className="mt-3 font-semibold text-white">Nenhuma demanda trabalhada neste dia</h3><p className="mt-1 text-sm text-slate-400">Selecione outra daily para consultar seu resumo.</p></div>; }
