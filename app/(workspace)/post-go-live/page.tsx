import Link from "next/link";
import { CalendarClock, Plus } from "lucide-react";
import { DemandCard } from "@/components/demand-card";
import { PageHeader } from "@/components/page-header";
import { getDemands } from "@/lib/data/demands";
import { isDemandDone } from "@/lib/data/model";

export const metadata = { title: "Demandas pós-go-live" };

export default async function PostGoLivePage() {
  const demands = (await getDemands()).filter((demand) => demand.status === "Pós-go-live" && !isDemandDone(demand));
  const itemCount = demands.reduce((total, demand) => total + demand.items.length, 0);

  return <>
    <PageHeader eyebrow="Backlog futuro" title="Demandas pós-go-live" description={`${demands.length} ${demands.length === 1 ? "demanda planejada" : "demandas planejadas"} · ${itemCount} itens`} actions={<Link href="/demands/new" className="focus-ring flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white"><Plus className="size-4"/>Nova demanda</Link>}/>
    <main className="space-y-5 p-5 sm:p-8 lg:p-10">
      <aside className="rounded-xl border border-violet-400/20 bg-violet-400/5 p-4">
        <div className="flex items-start gap-3"><span className="rounded-lg border border-violet-400/20 bg-violet-400/10 p-2 text-violet-200"><CalendarClock className="size-4"/></span><div><p className="text-sm font-semibold text-violet-100">Fora do backlog do go-live</p><p className="mt-1 text-sm leading-6 text-slate-400">Estas demandas já passaram pela análise, mas foram planejadas para depois da publicação do novo site. Elas permanecem separadas das demandas atuais até o momento certo de execução.</p></div></div>
      </aside>
      <div className="space-y-3">{demands.map((demand) => <DemandCard key={demand.id} demand={demand}/>)}</div>
      {!demands.length && <div className="panel rounded-xl p-10 text-center"><CalendarClock className="mx-auto size-8 text-violet-300"/><p className="mt-3 font-semibold">Nenhuma demanda planejada para o pós-go-live</p><p className="mt-1 text-sm text-slate-400">O futuro ainda está com espaço no backlog.</p></div>}
    </main>
  </>;
}
