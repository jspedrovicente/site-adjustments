import { CircleHelp, ExternalLink, MessageSquareText, UserRound } from "lucide-react";
import { updateItemResolution } from "@/app/(workspace)/demands/actions";
import type { Attachment, DemandItem as Item } from "@/lib/data/model";
import { cn } from "@/lib/utils";
import { PreviewImage } from "./image-lightbox";

const labels = { change: "Ajuste", question: "Dúvida", reference: "Referência", figma: "Figma", other: "Outro" };
const resolutionLabels = { pending: "Pendente", done: "Concluído", done_with_caveats: "Concluído com ressalvas", business_rule_conflict: "Quebra regra de negócio" };

export function DemandItem({ item }: { item: Item }) {
  const question = item.type === "question";
  const current = item.attachments.filter((attachment) => attachment.role === "current_state");
  const expected = item.attachments.filter((attachment) => attachment.role === "expected_state");
  const others = item.attachments.filter((attachment) => !["current_state", "expected_state"].includes(attachment.role));
  const special = item.resolution === "done_with_caveats" || item.resolution === "business_rule_conflict";

  return <article className={cn(
    "overflow-hidden rounded-xl border border-slate-700/70 bg-slate-900/70 shadow-xl shadow-black/15",
    question && "border-cyan-500/35",
    special && "border-amber-500/40",
  )}>
    <div className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {question && <span className="rounded-lg bg-cyan-400/10 p-2 text-cyan-300"><CircleHelp className="size-4"/></span>}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-mono text-xs font-semibold uppercase tracking-wide text-cyan-300">{labels[item.type]}{item.number ? ` · Item ${item.number}` : ""}</p>
              {item.assignee && <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/25 bg-violet-400/10 px-2.5 py-1 text-xs font-semibold text-violet-200"><UserRound className="size-3.5"/>Atribuído a {item.assignee}</span>}
            </div>
            <p className="mt-2 whitespace-pre-wrap text-[15px] leading-7 text-slate-200">{item.description}</p>
          </div>
        </div>
        {item.resolution !== "pending" && <span className={cn("shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold", special ? "border-amber-400/30 bg-amber-400/10 text-amber-200" : "border-emerald-400/30 bg-emerald-400/10 text-emerald-200")}>{resolutionLabels[item.resolution]}</span>}
      </div>

      {item.annotations.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{item.annotations.map((annotation) => <span key={annotation.id} className={cn("rounded-md border px-2.5 py-1 text-xs", annotation.semantic === "done" ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" : annotation.semantic === "important" ? "border-cyan-400/25 bg-cyan-400/10 text-cyan-200" : "border-slate-600 bg-slate-800 text-slate-300")}>{annotation.semantic === "important" ? "Importante" : annotation.semantic === "done" ? "Feito" : annotation.text ?? annotation.semantic}</span>)}</div>}

      {item.developerResponse && <div className={cn("mt-5 rounded-lg border p-4", special ? "border-amber-400/25 bg-amber-400/5" : "border-slate-700 bg-slate-800/60")}><p className={cn("flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wide", special ? "text-amber-200" : "text-slate-400")}><MessageSquareText className="size-4"/>{special ? "Justificativa do desenvolvimento" : "Resposta do desenvolvimento"}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-200">{item.developerResponse}</p></div>}

      {current.length > 0 && expected.length > 0 ? <div className="mt-6 grid gap-4 lg:grid-cols-2"><Gallery title="Como está" images={current}/><Gallery title="Como deve ficar" images={expected}/></div> : <div className="mt-6 space-y-5">{current.length > 0 && <Gallery title="Como está" images={current}/>} {expected.length > 0 && <Gallery title="Como deve ficar" images={expected}/>}</div>}
      {others.length > 0 && <div className="mt-6"><Gallery title="Imagens e referências" images={others}/></div>}
      {item.links.length > 0 && <div className="mt-5 flex flex-wrap gap-3">{item.links.map((link) => <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm font-medium text-cyan-300 hover:text-cyan-200">{link.label ?? link.url}<ExternalLink className="size-3"/></a>)}</div>}
    </div>

    <details className="group border-t border-slate-700/70 bg-slate-950/45">
      <summary className="cursor-pointer list-none px-5 py-3.5 font-mono text-sm font-semibold text-indigo-200 marker:hidden sm:px-6">{">"} Atualizar situação do item <span className="ml-1 text-slate-500 transition group-open:rotate-180">⌄</span></summary>
      <form action={updateItemResolution} className="grid gap-3 border-t border-slate-700/70 p-5 sm:grid-cols-[220px_minmax(0,1fr)_auto] sm:p-6">
        <input type="hidden" name="demand_id" value={item.demandId}/>
        <input type="hidden" name="item_id" value={item.id}/>
        <select name="resolution" defaultValue={item.resolution} className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-slate-100"><option value="pending">Pendente</option><option value="done">Concluído</option><option value="done_with_caveats">Concluído com ressalvas</option><option value="business_rule_conflict">Quebra regra de negócio</option></select>
        <textarea name="developer_response" defaultValue={item.developerResponse} placeholder="Resposta ou justificativa (obrigatória para estados especiais)" className="min-h-24 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"/>
        <button className="h-fit rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-950/30 transition hover:brightness-110">Salvar situação</button>
      </form>
    </details>
  </article>;
}

function Gallery({ title, images }: { title: string; images: Attachment[] }) {
  return <section><h3 className="mb-2 font-mono text-sm font-semibold text-slate-300">{title}</h3><div className="space-y-3">{images.map((image) => image.signedUrl ? <PreviewImage key={image.id} src={image.signedUrl} alt={image.name}/> : <div key={image.id} className="rounded-lg border border-slate-700 bg-slate-800 p-5 text-sm text-slate-400">Imagem indisponível</div>)}</div></section>;
}
