import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getDemands } from "@/lib/data/demands";
import { isDemandPendingAnalysis } from "@/lib/data/model";
import { approveDemand, rejectDemand } from "./actions";

type Params = Promise<Record<string, string | string[] | undefined>>;

export default async function ApprovalsPage({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  const demands = (await getDemands()).filter(isDemandPendingAnalysis);
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const message = error === "not-configured"
    ? "Configure APPROVAL_PASSWORD no .env.local."
    : error === "invalid-password"
      ? "Senha de análise incorreta."
      : error === "reason-required"
        ? "Informe uma justificativa para reprovar a demanda."
        : error
          ? "Não foi possível registrar a análise. Verifique as permissões RLS."
          : null;

  return <>
    <PageHeader eyebrow="Revisão" title="Demandas pendentes de análise" description={`${demands.length} aguardando sua análise`}/>
    <main className="space-y-4 p-5 sm:p-8 lg:p-10">
      <aside className="relative overflow-hidden rounded-xl border border-violet-400/20 bg-slate-950/65 p-4 shadow-lg shadow-violet-950/20 before:absolute before:-right-10 before:-top-12 before:size-32 before:rounded-full before:bg-violet-400/10 before:blur-2xl">
        <div className="relative flex items-start gap-3">
          <span className="rounded-lg border border-violet-400/20 bg-violet-400/10 p-2 text-violet-300"><ShieldCheck className="size-4"/></span>
          <div>
            <p className="mt-1.5 text-sm text-slate-300">Marco, aprove aqui as demandas que vão entrar no backlog de desenvolvimento. Com paciência — porque nem todo ajuste é só um ajuste. ☕</p>
          </div>
        </div>
      </aside>

      {message && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{message}</div>}
      {params.created && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">Demanda criada e enviada para análise.</div>}
      {params.rejected && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">Demanda reprovada e movida para Demandas reprovadas.</div>}

      {demands.map((demand) => <article key={demand.id} className="panel rounded-xl p-5">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-wide text-amber-200">{demand.category?.name ?? "Sem categoria"}</p>
          <Link href={`/demands/${demand.id}`} className="mt-1 block text-lg font-semibold text-white hover:text-cyan-300">{demand.title}</Link>
          <p className="mt-2 text-sm text-slate-400">{demand.items.length} itens · Responsável: {demand.developer ?? "Não atribuído"}</p>
        </div>
        <div className="mt-5 grid gap-3 border-t border-slate-700/60 pt-5 lg:grid-cols-2">
          <form action={approveDemand} className="flex flex-col gap-2 sm:flex-row">
            <input type="hidden" name="id" value={demand.id}/>
            <input type="password" name="password" required placeholder="Senha de análise" className="focus-ring min-w-0 flex-1 rounded-lg border px-3 py-2.5 text-sm"/>
            <button className="focus-ring flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white"><ShieldCheck className="size-4"/>Aprovar demanda</button>
          </form>
          <details className="rounded-lg border border-red-200 bg-red-50">
            <summary className="cursor-pointer px-4 py-2.5 text-sm font-semibold text-red-700">Reprovar demanda</summary>
            <form action={rejectDemand} className="space-y-2 border-t border-red-200 p-3">
              <input type="hidden" name="id" value={demand.id}/>
              <textarea name="reason" required placeholder="Justificativa da reprovação" className="focus-ring min-h-20 w-full rounded-lg border px-3 py-2 text-sm"/>
              <div className="flex gap-2"><input type="password" name="password" required placeholder="Senha de análise" className="focus-ring min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm"/><button className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white">Confirmar reprovação</button></div>
            </form>
          </details>
        </div>
      </article>)}

      {!demands.length && <div className="panel rounded-xl p-10 text-center"><ShieldCheck className="mx-auto size-8 text-emerald-300"/><p className="mt-3 font-semibold">Nenhuma demanda aguardando análise</p><p className="mt-1 font-mono text-xs text-slate-500">Marco protegeu o backlog. Por enquanto.</p></div>}
    </main>
  </>;
}
