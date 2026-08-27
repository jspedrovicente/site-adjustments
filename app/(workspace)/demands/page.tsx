import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { getDemands } from "@/lib/data/demands";
import { PageHeader } from "@/components/page-header";
import { DemandCard } from "@/components/demand-card";
import { isDemandAwaitingConfirmation, isDemandDone, isDemandPendingAnalysis, isItemDone } from "@/lib/data/model";

export const metadata = { title: "Demandas" };
type RawParams = Record<string, string | string[] | undefined>;
type Params = Promise<RawParams>;
const PAGE_SIZE = 10;
const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] ?? "" : value ?? "";

export default async function DemandsPage({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  const all = await getDemands();
  const q = one(params.q).toLowerCase(), category = one(params.category), priority = one(params.priority), status = one(params.status), type = one(params.type), responsible = one(params.responsible);
  const important = one(params.important) === "true", pending = one(params.pending) === "true", completedOnly = one(params.completed) === "true";
  const values = (key: "priority" | "status") => [...new Set(all.map((demand) => demand[key]).filter(Boolean))].sort();
  const categories = [...new Set(all.map((demand) => demand.category?.name).filter((value): value is string => !!value))].sort();
  const people = [...new Set(all.flatMap((demand) => [demand.developer, ...demand.items.map((item) => item.assignee)]).filter((value): value is string => !!value))].sort();
  const demands = all.filter((demand) => !isDemandPendingAnalysis(demand) && !isDemandAwaitingConfirmation(demand) && (completedOnly ? isDemandDone(demand) : !isDemandDone(demand)) && (!q || `${demand.title} ${demand.sourceId ?? ""} ${demand.developer ?? ""}`.toLowerCase().includes(q)) && (!category || demand.category?.name === category) && (!priority || demand.priority === priority) && (!status || demand.status.toLowerCase().includes(status.toLowerCase())) && (!type || demand.items.some((item) => item.type === type)) && (!responsible || demand.developer === responsible || demand.items.some((item) => item.assignee === responsible)) && (!important || demand.items.some((item) => item.annotations.some((annotation) => annotation.semantic === "important"))) && (!pending || demand.items.some((item) => !isItemDone(item))));
  const itemCount = demands.reduce((total, demand) => total + demand.items.length, 0);
  const totalPages = Math.max(1, Math.ceil(demands.length / PAGE_SIZE));
  const requestedPage = Number.parseInt(one(params.page), 10) || 1;
  const page = Math.min(Math.max(requestedPage, 1), totalPages);
  const visibleDemands = demands.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return <>
    <PageHeader eyebrow={completedOnly ? "Arquivo" : "Acompanhamento"} title={completedOnly ? "Concluídos" : "Demandas"} description={`${demands.length} demandas encontradas · ${itemCount} itens encontrados`} actions={<Link href="/demands/new" className="focus-ring flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white"><Plus className="size-4"/>Nova demanda</Link>}/>
    <div className="p-5 sm:p-8 lg:p-10">
      <form className="panel mb-6 grid gap-3 rounded-lg p-4 md:grid-cols-2 xl:grid-cols-6">{completedOnly && <input type="hidden" name="completed" value="true"/>}<label className="relative md:col-span-2"><Search className="absolute left-3 top-3 size-4 text-slate-400"/><input name="q" defaultValue={q} placeholder="Buscar título, ID ou responsável" className="focus-ring h-10 w-full rounded-md border bg-white pl-10 pr-3 text-sm"/></label><Select name="responsible" value={responsible} label="Responsável ou atribuído" options={people}/><Select name="category" value={category} label="Todas as categorias" options={categories}/><Select name="priority" value={priority} label="Prioridade" options={values("priority")}/><Select name="status" value={status} label="Status" options={values("status")}/><Select name="type" value={type} label="Tipo de item" options={["change", "question", "reference", "figma", "other"]}/><div className="flex flex-wrap items-center gap-4 md:col-span-2 xl:col-span-5"><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="important" value="true" defaultChecked={important}/>Somente importantes</label>{!completedOnly && <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="pending" value="true" defaultChecked={pending}/>Com itens pendentes</label>}</div><button className="focus-ring h-10 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white">Aplicar filtros</button></form>
      <div className="space-y-3">{visibleDemands.length ? visibleDemands.map((demand) => <DemandCard key={demand.id} demand={demand}/>) : <div className="panel rounded-lg p-10 text-center"><p className="font-medium">Nenhuma demanda encontrada</p><p className="mt-1 text-sm text-slate-500">Tente remover alguns filtros.</p></div>}</div>
      {demands.length > PAGE_SIZE && <nav aria-label="Paginação" className="mt-6 flex flex-col items-center justify-between gap-3 border-t pt-5 sm:flex-row"><p className="text-sm text-slate-500">Página <strong>{page}</strong> de <strong>{totalPages}</strong> · exibindo {visibleDemands.length} demandas</p><div className="flex items-center gap-2"><PageLink href={pageHref(params, page - 1)} disabled={page === 1}><ChevronLeft className="size-4"/>Anterior</PageLink><PageLink href={pageHref(params, page + 1)} disabled={page === totalPages}>Próxima<ChevronRight className="size-4"/></PageLink></div></nav>}
    </div>
  </>;
}

function pageHref(params: RawParams, page: number) { const query = new URLSearchParams(); for (const [key, value] of Object.entries(params)) { if (key === "page" || value == null) continue; if (Array.isArray(value)) value.forEach((entry) => query.append(key, entry)); else query.set(key, value); } query.set("page", String(page)); return `/demands?${query.toString()}`; }
function PageLink({ href, disabled, children }: { href: string; disabled: boolean; children: React.ReactNode }) { return disabled ? <span className="flex items-center gap-1 rounded-md border px-3 py-2 text-sm text-slate-300">{children}</span> : <Link href={href} className="focus-ring flex items-center gap-1 rounded-md border bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">{children}</Link>; }
function Select({ name, value, label, options }: { name: string; value: string; label: string; options: string[] }) { return <select name={name} defaultValue={value} className="focus-ring h-10 min-w-0 rounded-md border bg-white px-3 text-sm"><option value="">{label}</option>{options.map((option) => <option key={option}>{option}</option>)}</select>; }
