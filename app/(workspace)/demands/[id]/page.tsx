import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Pencil, UserRound } from "lucide-react";
import { PriorityBadge, StatusBadge } from "@/components/badges";
import { DemandItem } from "@/components/demand-item";
import { getDemand, signDemandImages } from "@/lib/data/demands";
import { isDemandAwaitingConfirmation } from "@/lib/data/model";
import { returnDemandForFeedback } from "../../confirmations/actions";

export default async function DemandDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const query = await searchParams;
  const found = await getDemand(id);
  if (!found) notFound();
  const demand = await signDemandImages(found);
  const awaitingConfirmation = isDemandAwaitingConfirmation(demand);
  const draftFeedbackCount = demand.items.flatMap((item) => item.feedback ?? []).filter((feedback) => feedback.status === "draft").length;
  const feedbackError = query.error === "feedback-invalid" ? "Descreva o ajuste com pelo menos três caracteres." : query.error === "feedback-failed" ? "Não foi possível salvar o feedback. Verifique se as migrações do banco foram aplicadas." : query.error === "no-feedback" ? "Adicione feedback a pelo menos um item antes de devolver a demanda." : null;

  return <>
    <header className="relative overflow-hidden border-b border-white/10 bg-slate-950/55 px-5 py-6 text-slate-100 backdrop-blur-md before:absolute before:-right-20 before:-top-32 before:size-72 before:rounded-full before:bg-cyan-500/10 before:blur-3xl sm:px-8 lg:px-10">
      <div className="relative">
        <Link href="/demands" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-cyan-300"><ArrowLeft className="size-4"/>Voltar para demandas</Link>
        <div className="flex flex-col gap-5 xl:flex-row xl:justify-between">
          <div>
            <p className="font-mono text-xs font-medium uppercase tracking-wide text-cyan-300">{"// "}{demand.category?.name ?? "Sem categoria"}{demand.sourceId && ` · #${demand.sourceId}`}</p>
            <h1 className="mt-2 max-w-4xl text-3xl font-bold tracking-tight text-white">{demand.title}</h1>
            {demand.description && <p className="mt-3 max-w-4xl whitespace-pre-wrap text-sm leading-6 text-slate-300">{demand.description}</p>}
            <div className="mt-4 flex flex-wrap gap-2"><PriorityBadge value={demand.priority}/><StatusBadge value={demand.status}/></div>
          </div>
          <Link href={`/demands/${id}/edit`} className="flex h-fit items-center gap-2 rounded-lg border border-indigo-400/25 bg-indigo-400/10 px-4 py-2.5 text-sm font-semibold text-indigo-100 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"><Pencil className="size-4"/>Editar demanda</Link>
        </div>
        <dl className="mt-7 grid gap-4 border-t border-slate-700/70 pt-5 sm:grid-cols-2 xl:grid-cols-4">
          <Meta label="Responsável" value={demand.developer} icon={<UserRound className="size-4"/>}/>
          <Meta label="Prazo" value={formatDate(demand.deadline)} icon={<CalendarDays className="size-4"/>}/>
          <Meta label="Resultado da validação" value={demand.validationResult}/>
          <Meta label="Observações" value={demand.validationNotes}/>
        </dl>
      </div>
    </header>
    <main className="p-5 sm:p-8 lg:p-10">
      <div className="mx-auto max-w-6xl">
        {query["feedback-added"] && <div className="mb-4 rounded-lg border border-violet-300/30 bg-violet-400/10 p-4 text-sm font-medium text-violet-100">Feedback adicionado. Você pode continuar revisando os outros itens antes de devolver a demanda.</div>}
        {feedbackError && <div className="mb-4 rounded-lg border border-red-300/30 bg-red-400/10 p-4 text-sm font-medium text-red-100">{feedbackError}</div>}
        {awaitingConfirmation && <form action={returnDemandForFeedback} className="mb-5 flex flex-col gap-3 rounded-xl border border-amber-400/30 bg-amber-400/[.07] p-4 sm:flex-row sm:items-center sm:justify-between"><input type="hidden" name="demand_id" value={demand.id}/><input type="hidden" name="return_to" value="detail"/><p className="text-sm text-amber-100">{draftFeedbackCount > 0 ? <><strong>{draftFeedbackCount}</strong> {draftFeedbackCount === 1 ? "feedback preparado" : "feedbacks preparados"}. Revise todos os itens e envie quando terminar.</> : "Adicione feedback aos itens necessários. O envio será liberado quando houver feedback preparado."}</p><button disabled={!draftFeedbackCount} className="focus-ring rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40">Enviar demanda para ajustes</button></form>}
        <div className="mb-4 flex justify-between"><h2 className="font-mono text-lg font-semibold text-slate-100">Itens da demanda</h2><span className="text-sm text-slate-400">{demand.items.length} itens</span></div>
        <div className="space-y-4">{demand.items.length ? demand.items.map((item) => <DemandItem key={item.id} item={item} canRequestFeedback={awaitingConfirmation}/>) : <div className="panel rounded-xl p-10 text-center text-sm">Esta demanda ainda não possui itens.</div>}</div>
      </div>
    </main>
  </>;
}

function Meta({ label, value, icon }: { label: string; value?: string; icon?: React.ReactNode }) {
  return <div className="rounded-lg border border-slate-700/60 bg-slate-900/30 px-3 py-2.5"><dt className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-slate-400">{icon}{label}</dt><dd className="mt-1.5 text-sm font-medium text-slate-100">{value || "—"}</dd></div>;
}

function formatDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat("pt-BR").format(date);
}
