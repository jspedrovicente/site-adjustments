import Link from "next/link";
import { AlertTriangle, BadgeCheck, Clock3, MessageSquarePlus, MessageSquareText, Terminal, UserRound } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getDemands } from "@/lib/data/demands";
import { isDemandAwaitingConfirmation, type DemandItem } from "@/lib/data/model";
import { finalizeDemand, requestItemFeedback, returnDemandForFeedback } from "./actions";
import { MarkAllProduction } from "./mark-all-production";
import { ProductionToggle } from "./production-toggle";

type Params = Promise<Record<string, string | string[] | undefined>>;

export default async function ConfirmationsPage({
  searchParams,
}: {
  searchParams: Params;
}) {
  const params = await searchParams;
  const demands = (await getDemands()).filter(isDemandAwaitingConfirmation);
  const productionDemands = demands.filter((demand) => demand.inProduction);
  const awaitingProductionDemands = demands.filter(
    (demand) => !demand.inProduction,
  );
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const message =
    error === "not-configured"
      ? "Configure COMPLETION_PASSWORD no .env.local."
      : error === "invalid-password"
        ? "Senha de finalização incorreta."
        : error === "items-pending"
          ? "Ainda existem itens pendentes nesta demanda."
          : error === "production-update-failed"
            ? "Não foi possível atualizar o status de produção. Verifique as permissões RLS."
            : error === "feedback-invalid"
              ? "Selecione um item e descreva o ajuste solicitado."
              : error === "feedback-failed"
                ? "Não foi possível registrar o feedback. Verifique se as migrações e políticas do banco foram aplicadas."
                : error === "no-feedback"
                  ? "Adicione feedback a pelo menos um item antes de devolver a demanda."
            : error
              ? "Não foi possível finalizar. Verifique as permissões RLS."
              : null;

  return (
    <>
      <PageHeader
        eyebrow="Validação final"
        title="Pendentes de confirmação"
        description={`${productionDemands.length} em produção · ${awaitingProductionDemands.length} aguardando produção`}
      />
      <main className="space-y-4 p-5 sm:p-8 lg:p-10">
        <aside className="relative overflow-hidden rounded-xl border border-cyan-400/20 bg-slate-950/65 p-4 shadow-lg shadow-cyan-950/20 before:absolute before:-right-10 before:-top-12 before:size-32 before:rounded-full before:bg-cyan-400/10 before:blur-2xl">
          <div className="relative flex items-start gap-3">
            <span className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 p-2 text-cyan-300">
              <Terminal className="size-4" />
            </span>
            <div>
              <p className="mt-1.5 text-sm text-slate-300">
                João, aprove as demandas que estão prontas aqui para eliminar da
                lista. 🚀
              </p>
            </div>
          </div>
        </aside>

        {message && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {message}
          </div>
        )}
        {params.finalized && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
            Demanda finalizada e movida para Concluídos.
          </div>
        )}
        {params["feedback-requested"] && (
          <div className="rounded-lg border border-amber-300/30 bg-amber-400/10 p-4 text-sm font-medium text-amber-100">
            Feedback enviado. A demanda voltou para a equipe de desenvolvimento.
          </div>
        )}
        {params["feedback-added"] && (
          <div className="rounded-lg border border-violet-300/30 bg-violet-400/10 p-4 text-sm font-medium text-violet-100">
            Feedback adicionado. Você pode revisar outros itens antes de devolver a demanda.
          </div>
        )}

        {!!awaitingProductionDemands.length && (
          <div className="flex justify-end">
            <MarkAllProduction
              demandIds={awaitingProductionDemands.map((demand) => demand.id)}
            />
          </div>
        )}

        <DemandGroup
          title="Em produção"
          count={productionDemands.length}
          demands={productionDemands}
        />
        <DemandGroup
          title="Ainda não estão em produção"
          count={awaitingProductionDemands.length}
          demands={awaitingProductionDemands}
        />

        {!demands.length && (
          <div className="panel rounded-xl p-10 text-center">
            <BadgeCheck className="mx-auto size-8 text-cyan-300" />
            <p className="mt-3 font-semibold">
              Nenhuma demanda aguardando confirmação
            </p>
            <p className="mt-1 font-mono text-xs text-slate-500">
              João zerou a fila. LGTM.
            </p>
          </div>
        )}
      </main>
    </>
  );
}

function DemandGroup({
  title,
  count,
  demands,
}: {
  title: string;
  count: number;
  demands: Awaited<ReturnType<typeof getDemands>>;
}) {
  if (!count) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3 pt-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
          {title}
        </h2>
        <span className="rounded-full bg-slate-800 px-2.5 py-0.5 font-mono text-xs text-slate-400">
          {count}
        </span>
        <span className="h-px flex-1 bg-slate-800" />
      </div>
      {demands.map((demand) => (
        <article key={demand.id} className="panel rounded-xl p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-wide text-cyan-300">
                {demand.category?.name ?? "Sem categoria"}
              </p>
              <Link
                href={`/demands/${demand.id}`}
                className="mt-1 block text-lg font-semibold text-white hover:text-cyan-300"
              >
                {demand.title}
              </Link>
              <p className="mt-2 text-sm text-slate-400">
                Todos os {demand.items.length} itens foram resolvidos e estão prontos para validação.
              </p>
            </div>
            <div className="flex flex-col gap-3 lg:items-end">
              <ProductionToggle
                demandId={demand.id}
                checked={demand.inProduction}
              />
              <form
                action={finalizeDemand}
                className="flex flex-col gap-2 sm:flex-row"
              >
                <input type="hidden" name="id" value={demand.id} />
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="Senha de finalização"
                  className="focus-ring rounded-lg border px-3 py-2.5 text-sm"
                />
                <button className="focus-ring flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-950/25">
                  <BadgeCheck className="size-4" />
                  Demanda finalizada
                </button>
              </form>
            </div>
          </div>
          <ExceptionSummary items={demand.items} />
          <ConfirmationHistory items={demand.items} demandId={demand.id} />
          <FeedbackRequest items={demand.items} demandId={demand.id} />
        </article>
      ))}
    </section>
  );
}

function FeedbackRequest({ items, demandId }: { items: DemandItem[]; demandId: string }) {
  const draftCount = items.flatMap((item) => item.feedback ?? []).filter((feedback) => feedback.status === "draft").length;
  return <><details className="group mt-5 overflow-hidden rounded-xl border border-violet-400/20 bg-violet-400/[.04]">
    <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3.5 text-sm font-semibold text-violet-200 marker:hidden"><MessageSquarePlus className="size-4"/>Solicitar ajuste em um item <span className="ml-auto text-slate-500 transition group-open:rotate-180">⌄</span></summary>
    <div className="divide-y divide-violet-400/15 border-t border-violet-400/15">
      {items.map((item, index) => <form key={item.id} action={requestItemFeedback} className="grid gap-3 p-4 lg:grid-cols-[minmax(220px,0.8fr)_minmax(280px,1.2fr)_auto] lg:items-start">
        <input type="hidden" name="demand_id" value={demandId}/><input type="hidden" name="item_id" value={item.id}/><input type="hidden" name="return_to" value="confirmations"/>
        <div><p className="font-mono text-xs font-semibold uppercase tracking-wide text-violet-300">Item {item.number ?? index + 1}</p><p className="mt-1 line-clamp-3 text-sm leading-6 text-slate-300">{item.description}</p></div>
        <textarea name="content" required minLength={3} placeholder="Descreva o que precisa ser ajustado ou acrescente novas informações..." className="min-h-28 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"/>
        <button className="focus-ring flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"><MessageSquarePlus className="size-4"/>Enviar feedback</button>
      </form>)}
    </div>
  </details><form action={returnDemandForFeedback} className="mt-3 flex flex-col gap-3 rounded-xl border border-amber-400/25 bg-amber-400/[.06] p-4 sm:flex-row sm:items-center sm:justify-between"><input type="hidden" name="demand_id" value={demandId}/><p className="text-sm text-amber-100">{draftCount > 0 ? <><strong>{draftCount}</strong> {draftCount === 1 ? "feedback preparado" : "feedbacks preparados"}. A demanda continuará nesta página até você enviá-la.</> : "Adicione feedback aos itens necessários. Quando terminar a revisão, envie a demanda para ajustes."}</p><button disabled={!draftCount} className="focus-ring rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40">Enviar demanda para ajustes</button></form></>;
}

function ConfirmationHistory({ items, demandId }: { items: DemandItem[]; demandId: string }) {
  const reviewedItems = items.filter((item) => (item.feedback ?? []).some((feedback) => feedback.status === "resolved"));
  if (!reviewedItems.length) return null;
  return <section className="mt-5 overflow-hidden rounded-xl border border-emerald-400/25 bg-emerald-400/[.04]"><div className="flex items-center justify-between border-b border-emerald-400/15 px-4 py-3"><h3 className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wide text-emerald-200"><MessageSquareText className="size-4"/>Histórico desta validação</h3><span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-200">{reviewedItems.length} {reviewedItems.length === 1 ? "item revisado" : "itens revisados"}</span></div><div className="divide-y divide-emerald-400/15">{reviewedItems.map((item) => <div key={item.id} className="p-4"><p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wide text-slate-400">Item {item.number ?? items.indexOf(item) + 1}</p><FeedbackPreview item={item} demandId={demandId}/></div>)}</div></section>;
}

function FeedbackPreview({ item, demandId }: { item: DemandItem; demandId: string }) {
  const history = (item.feedback ?? []).filter((feedback) => feedback.status === "resolved");
  const latest = history[history.length - 1];
  if (!latest) return null;
  return <div className="rounded-lg border border-emerald-400/20 bg-slate-950/25 p-3"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">Feedback respondido</span><span className="text-[11px] text-slate-400">{history.length} {history.length === 1 ? "rodada de revisão" : "rodadas de revisão"}</span></div><div className="mt-2 space-y-2 text-xs leading-5"><p className="text-slate-300"><strong className="text-violet-200">Validador: </strong>{latest.content}</p><p className="text-slate-300"><strong className="text-emerald-200">Desenvolvimento: </strong>{latest.developerResponse || "Feedback marcado como atendido."}</p></div><Link href={`/demands/${demandId}`} className="mt-2 inline-flex text-xs font-semibold text-cyan-300 hover:text-cyan-200">Ver conversa completa →</Link></div>;
}

const exceptionLabels = {
  done_with_caveats: "Concluído com ressalvas",
  business_rule_conflict: "Quebra de regra de negócio",
  future_version: "Encaminhado para versão futura",
} as const;

function ExceptionSummary({ items }: { items: DemandItem[] }) {
  const exceptions = items.filter((item) => item.resolution === "done_with_caveats" || item.resolution === "business_rule_conflict" || item.resolution === "future_version");
  if (!exceptions.length) return null;
  return <section className="mt-5 overflow-hidden rounded-xl border border-amber-400/25 bg-amber-400/[.05]"><div className="flex items-center justify-between border-b border-amber-400/15 px-4 py-3"><h3 className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wide text-amber-200"><AlertTriangle className="size-4"/>Resumo para validação</h3><span className="rounded-full bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-200">{exceptions.length} {exceptions.length === 1 ? "exceção" : "exceções"}</span></div><div className="divide-y divide-amber-400/15">{exceptions.map((item) => { const specialResolution = item.resolution as keyof typeof exceptionLabels; const tone = item.resolution === "business_rule_conflict" ? "text-rose-200 bg-rose-400/10 border-rose-400/20" : item.resolution === "future_version" ? "text-violet-200 bg-violet-400/10 border-violet-400/20" : "text-amber-200 bg-amber-400/10 border-amber-400/20"; return <article key={item.id} className="p-4"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-md border px-2 py-1 text-[11px] font-semibold ${tone}`}>{exceptionLabels[specialResolution]}</span>{item.number && <span className="text-xs text-slate-500">Item {item.number}</span>}<span className="ml-auto inline-flex items-center gap-1 text-xs text-slate-400"><UserRound className="size-3.5"/>{item.assignee ?? "Sem responsável"}</span></div><p className="mt-3 text-sm font-medium leading-6 text-slate-100">{item.description}</p><div className="mt-3 rounded-lg border border-slate-700/60 bg-slate-950/30 p-3"><p className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-wide text-amber-200"><MessageSquareText className="size-3.5"/>Justificativa do desenvolvimento</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">{item.developerResponse?.trim() || "Nenhuma justificativa foi registrada para este item."}</p></div>{item.updatedAt && <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-500"><Clock3 className="size-3"/>Atualizado em {new Date(item.updatedAt).toLocaleString("pt-BR")}</p>}</article>; })}</div></section>;
}
