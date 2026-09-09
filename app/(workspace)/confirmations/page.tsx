import Link from "next/link";
import { AlertTriangle, BadgeCheck, Clock3, MessageSquareText, Terminal, UserRound } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getDemands } from "@/lib/data/demands";
import { isDemandAwaitingConfirmation, type DemandItem } from "@/lib/data/model";
import { finalizeDemand } from "./actions";
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
        </article>
      ))}
    </section>
  );
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
