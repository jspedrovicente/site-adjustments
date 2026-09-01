"use client";

import { useTransition } from "react";
import { CheckCheck, LoaderCircle } from "lucide-react";
import { setAllDemandsProduction } from "./actions";

export function MarkAllProduction({ demandIds }: { demandIds: string[] }) {
  const [isPending, startTransition] = useTransition();

  return <form action={(formData) => startTransition(() => setAllDemandsProduction(formData))}>
    {demandIds.map((id) => <input key={id} type="hidden" name="id" value={id}/>)}
    <button
      type="submit"
      disabled={isPending || !demandIds.length}
      title="DEV ONLY — marca todas as demandas abaixo como em produção"
      className="focus-ring flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-2.5 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isPending ? <LoaderCircle className="size-4 animate-spin"/> : <CheckCheck className="size-4"/>}
      {isPending ? "Marcando..." : "Marcar todos como em Prod"}
      <span className="rounded border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 font-mono text-[10px] text-amber-300">DEV ONLY</span>
    </button>
  </form>;
}
