import Link from "next/link";
import { ArrowRight, Layers3, Rocket, UserRound } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/badges";
import { getDemands } from "@/lib/data/demands";
import { isDemandDraft } from "@/lib/data/model";

export const metadata = { title: "Próximas versões" };

export default async function FutureVersionsPage() {
  const demands = await getDemands();
  const futureDemands = demands.filter((demand) => !isDemandDraft(demand)).map((demand) => ({
    demand,
    items: demand.items.filter((item) => item.resolution === "future_version"),
  })).filter(({ items }) => items.length > 0);
  const totalItems = futureDemands.reduce((total, entry) => total + entry.items.length, 0);

  return <>
    <PageHeader eyebrow="Roadmap" title="Próximas versões" description={`${totalItems} ${totalItems === 1 ? "item reservado" : "itens reservados"} para evoluções futuras`}/>
    <main className="space-y-5 p-5 sm:p-8 lg:p-10">
      <aside className="rounded-xl border border-violet-400/20 bg-violet-400/5 p-4">
        <div className="flex items-start gap-3"><span className="rounded-lg border border-violet-400/20 bg-violet-400/10 p-2 text-violet-200"><Layers3 className="size-4"/></span><div><p className="text-sm font-semibold text-violet-100">Nada fica perdido entre versões</p><p className="mt-1 text-sm leading-6 text-slate-400">Estes itens não fazem parte da entrega atual, mas permanecem vinculados à demanda original para serem revisitados no planejamento futuro.</p></div></div>
      </aside>

      {futureDemands.map(({ demand, items }) => <article key={demand.id} className="panel overflow-hidden rounded-xl">
        <header className="flex flex-col gap-3 border-b border-slate-700/60 bg-slate-950/25 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div><div className="flex flex-wrap items-center gap-2"><p className="font-mono text-xs font-semibold uppercase tracking-wide text-violet-300">{demand.category?.name ?? "Sem categoria"}</p><StatusBadge value={demand.status}/></div><Link href={`/demands/${demand.id}`} className="mt-1.5 block text-lg font-semibold text-white transition hover:text-violet-200">{demand.title}</Link></div>
          <Link href={`/demands/${demand.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-violet-200 hover:text-violet-100">Abrir demanda<ArrowRight className="size-4"/></Link>
        </header>
        <div className="divide-y divide-slate-700/60">{items.map((item, index) => <div key={item.id} className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0"><p className="font-mono text-[11px] font-semibold uppercase tracking-wide text-violet-300">Item {item.number ?? index + 1} · Futura versão</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-200">{item.description}</p></div>
            <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-violet-400/20 bg-violet-400/10 px-2.5 py-1 text-xs font-semibold text-violet-200"><Rocket className="size-3.5"/>Roadmap</span>
          </div>
          {item.developerResponse && <div className="mt-4 rounded-lg border border-violet-400/15 bg-violet-400/5 p-3"><p className="font-mono text-[11px] uppercase tracking-wide text-violet-300">Contexto para a próxima versão</p><p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-slate-300">{item.developerResponse}</p></div>}
          {item.assignee && <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400"><UserRound className="size-3.5"/>Originalmente atribuído a <strong className="text-slate-300">{item.assignee}</strong></p>}
        </div>)}</div>
      </article>)}

      {!futureDemands.length && <div className="panel rounded-xl p-10 text-center"><Rocket className="mx-auto size-8 text-violet-300"/><p className="mt-3 font-semibold">Nenhum item aguardando uma futura versão</p><p className="mt-1 text-sm text-slate-400">O roadmap está estranhamente tranquilo.</p></div>}
    </main>
  </>;
}
