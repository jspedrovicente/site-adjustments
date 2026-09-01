"use client";

import { useRef, useTransition } from "react";
import { Info, LoaderCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { setDemandProduction } from "./actions";

export function ProductionToggle({ demandId, checked }: { demandId: string; checked: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  return <form ref={formRef} action={setDemandProduction} className="flex items-center gap-2">
    <input type="hidden" name="id" value={demandId}/>
    <input type="hidden" name="in_production" value={checked ? "on" : "off"}/>
    <Checkbox
      id={`production-${demandId}`}
      checked={checked}
      disabled={isPending}
      aria-label="Em produção"
      onCheckedChange={(value) => {
        const input = formRef.current?.elements.namedItem("in_production") as HTMLInputElement | null;
        if (input) input.value = value === true ? "on" : "off";
        startTransition(() => formRef.current?.requestSubmit());
      }}
      className="size-5 border-slate-500 data-[state=checked]:border-emerald-400 data-[state=checked]:bg-emerald-500"
    />
    <label htmlFor={`production-${demandId}`} className="cursor-pointer text-sm font-medium text-slate-200">Em produção</label>
    <span className="group relative inline-flex" tabIndex={0} aria-label="Controle disponível somente para o time de desenvolvimento">
      <span className="flex items-center gap-1 rounded border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-amber-300"><Info className="size-3"/>DEV ONLY</span>
      <span role="tooltip" className="pointer-events-none absolute bottom-full right-0 z-20 mb-2 hidden w-56 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-normal leading-5 text-slate-200 shadow-xl group-hover:block group-focus:block">Controle interno: use este marcador apenas para informar se a demanda já está em produção.</span>
    </span>
    {isPending && <LoaderCircle className="size-4 animate-spin text-cyan-300" aria-label="Salvando"/>}
  </form>;
}
