import Link from "next/link";
import { BadgeCheck, Terminal } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getDemands } from "@/lib/data/demands";
import { isDemandAwaitingConfirmation } from "@/lib/data/model";
import { finalizeDemand } from "./actions";

type Params = Promise<Record<string, string | string[] | undefined>>;

export default async function ConfirmationsPage({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  const demands = (await getDemands()).filter(isDemandAwaitingConfirmation);
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const message = error === "not-configured"
    ? "Configure COMPLETION_PASSWORD no .env.local."
    : error === "invalid-password"
      ? "Senha de finalização incorreta."
      : error === "items-pending"
        ? "Ainda existem itens pendentes nesta demanda."
        : error
          ? "Não foi possível finalizar. Verifique as permissões RLS."
          : null;

  return <>
    <PageHeader eyebrow="Validação final" title="Pendentes de confirmação" description={`${demands.length} demandas com todos os itens concluídos`}/>
    <main className="space-y-4 p-5 sm:p-8 lg:p-10">
      <aside className="relative overflow-hidden rounded-xl border border-cyan-400/20 bg-slate-950/65 p-4 shadow-lg shadow-cyan-950/20 before:absolute before:-right-10 before:-top-12 before:size-32 before:rounded-full before:bg-cyan-400/10 before:blur-2xl">
        <div className="relative flex items-start gap-3">
          <span className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 p-2 text-cyan-300"><Terminal className="size-4"/></span>
          <div>
            <p className="mt-1.5 text-sm text-slate-300">João, aprove as demandas que estão prontas aqui para eliminar da lista. 🚀</p>
          </div>
        </div>
      </aside>

      {message && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{message}</div>}
      {params.finalized && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">Demanda finalizada e movida para Concluídos.</div>}

      {demands.map((demand) => <article key={demand.id} className="panel rounded-xl p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-wide text-cyan-300">{demand.category?.name ?? "Sem categoria"}</p>
            <Link href={`/demands/${demand.id}`} className="mt-1 block text-lg font-semibold text-white hover:text-cyan-300">{demand.title}</Link>
            <p className="mt-2 text-sm text-slate-400">Todos os {demand.items.length} itens foram marcados como feitos.</p>
          </div>
          <form action={finalizeDemand} className="flex flex-col gap-2 sm:flex-row">
            <input type="hidden" name="id" value={demand.id}/>
            <input type="password" name="password" required placeholder="Senha de finalização" className="focus-ring rounded-lg border px-3 py-2.5 text-sm"/>
            <button className="focus-ring flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-950/25"><BadgeCheck className="size-4"/>Demanda finalizada</button>
          </form>
        </div>
      </article>)}

      {!demands.length && <div className="panel rounded-xl p-10 text-center"><BadgeCheck className="mx-auto size-8 text-cyan-300"/><p className="mt-3 font-semibold">Nenhuma demanda aguardando confirmação</p><p className="mt-1 font-mono text-xs text-slate-500">João zerou a fila. LGTM.</p></div>}
    </main>
  </>;
}
