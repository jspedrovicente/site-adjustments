import Link from "next/link";
import { Ban } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getDemands } from "@/lib/data/demands";
import { isDemandRejected } from "@/lib/data/model";

export default async function RejectedPage() {
  const demands = (await getDemands()).filter(isDemandRejected);

  return <>
    <PageHeader eyebrow="Histórico de análise" title="Demandas reprovadas" description="Demandas que não passaram pela inspeção — talvez ganhem uma nova versão no futuro."/>
    <main className="space-y-4 p-5 sm:p-8 lg:p-10">
      <p className="font-mono text-xs text-slate-500">{demands.length} {demands.length === 1 ? "demanda reprovada" : "demandas reprovadas"}</p>
      {demands.map((demand) => <article key={demand.id} className="panel rounded-xl p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-wide text-rose-300">{demand.category?.name ?? "Sem categoria"}</p>
            <Link href={`/demands/${demand.id}`} className="mt-1 block text-lg font-semibold text-white hover:text-rose-200">{demand.title}</Link>
            <p className="mt-2 text-sm text-slate-400">{demand.items.length} itens · Responsável: {demand.developer ?? "Não atribuído"}</p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-rose-400/25 bg-rose-400/10 px-3 py-1.5 text-xs font-semibold text-rose-200"><Ban className="size-4"/>Reprovada</span>
        </div>
        <div className="mt-5 rounded-lg border border-rose-400/20 bg-rose-400/5 p-4">
          <p className="font-mono text-xs font-semibold uppercase tracking-wide text-rose-300">Justificativa</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-200">{demand.validationNotes ?? "Justificativa não informada"}</p>
        </div>
      </article>)}
      {!demands.length && <div className="panel rounded-xl p-10 text-center"><Ban className="mx-auto size-8 text-slate-400"/><p className="mt-3 font-semibold">Nenhuma demanda reprovada</p><p className="mt-1 text-xs text-slate-500">Tudo passou pela inspeção. Estranhamente eficiente.</p></div>}
    </main>
  </>;
}
