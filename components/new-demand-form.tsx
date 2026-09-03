"use client";

import { useState } from "react";
import { AlertTriangle, CircleGauge, Plus, Star, Trash2 } from "lucide-react";
import { MultipleImageFields } from "@/components/multiple-image-fields";
import { SubmitButton } from "@/components/submit-button";

const developers = ["Vitor Moraes", "Lauro", "José", "Marco", "Elvis", "Wanderson"];
const itemTypes = [
  { value: "change", label: "Ajuste" },
  { value: "question", label: "Dúvida" },
  { value: "reference", label: "Referência" },
  { value: "figma", label: "Figma" },
  { value: "other", label: "Outro" },
];
const control = "focus-ring mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm";
type Category = { id: string; name: string };

export function NewDemandForm({ categories, action }: { categories: Category[]; action: (formData: FormData) => void | Promise<void> }) {
  const [items, setItems] = useState([crypto.randomUUID()]);

  return <form action={action} className="mx-auto max-w-5xl space-y-6">
    <section className="panel rounded-xl p-5 sm:p-7">
      <h2 className="mb-5 text-lg font-semibold">Informações gerais</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Título" name="title" required className="sm:col-span-2"/>
        <label className="sm:col-span-2"><span className="text-sm font-medium text-slate-300">Descrição geral da demanda</span><textarea name="description" className={`${control} min-h-24 resize-y`} placeholder="Contexto, objetivo ou observações gerais da demanda"/></label>
        <Select label="Categoria" name="category_id" options={categories.map((category) => ({ value: category.id, label: category.name }))}/>
        <Select label="Responsável geral" name="developer" options={developers.map((name) => ({ value: name, label: name }))}/>
        <div className="sm:col-span-2">
          <Select label="Prioridade" name="priority" options={["Alta", "Média", "Baixa"].map((value) => ({ value, label: value }))}/>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-200"><AlertTriangle className="size-3.5"/>Tente sempre definir um nível de prioridade para a demanda.</p>
        </div>
        <label className="sm:col-span-2 flex cursor-pointer items-start gap-3 rounded-xl border border-violet-400/20 bg-violet-400/5 p-4">
          <input type="checkbox" name="post_go_live" className="mt-0.5 size-4 accent-violet-500"/>
          <span><strong className="block text-sm text-violet-100">Demanda pós-go-live</strong><span className="mt-1 block text-xs leading-5 text-slate-400">Depois da aprovação, esta demanda irá para o módulo Pós-go-live e não entrará no backlog atual de desenvolvimento.</span></span>
        </label>
      </div>

      <div className="mt-5 rounded-xl border border-indigo-400/20 bg-slate-950/35 p-4">
        <div className="flex items-start gap-3">
          <span className="rounded-lg border border-indigo-400/20 bg-indigo-400/10 p-2 text-indigo-200"><CircleGauge className="size-4"/></span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-white">Como escolher a prioridade?</h3>
            <p className="mt-1 text-xs leading-5 text-slate-400">Use a prioridade com cuidado: se tudo for urgente, nada será realmente prioridade.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <PriorityGuide label="Baixa" className="border-cyan-400/20 bg-cyan-400/5 text-cyan-200">Tem baixa chance de ser executada antes do go-live e pode permanecer no backlog.</PriorityGuide>
              <PriorityGuide label="Média" className="border-amber-400/20 bg-amber-400/5 text-amber-200">Será considerada no planejamento conforme impacto, necessidade e capacidade da equipe.</PriorityGuide>
              <PriorityGuide label="Alta" className="border-rose-400/20 bg-rose-400/5 text-rose-200">É necessária para o go-live e deve receber atenção antes da publicação do novo site.</PriorityGuide>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-5 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-sm text-amber-100">Você pode salvar como <strong>Rascunho</strong> para continuar depois ou enviar a demanda pronta para análise.</p>
    </section>

    <section>
      <div className="mb-3 flex items-center justify-between">
        <div><h2 className="text-lg font-semibold">Itens</h2><p className="mt-1 text-xs text-slate-400">Descreva separadamente cada ajuste, dúvida ou referência.</p></div>
        <button type="button" onClick={() => setItems((current) => [...current, crypto.randomUUID()])} className="flex items-center gap-2 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/15"><Plus className="size-4"/>Adicionar item</button>
      </div>

      <div className="space-y-4">{items.map((key, index) => <div key={key} className="panel rounded-xl p-5 sm:p-7">
        <input type="hidden" name="item_key" value={key}/>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-xs font-semibold uppercase tracking-wide text-cyan-300">Item {index + 1}</p>
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-2 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-100"><input type="checkbox" name={`item_important_${key}`} className="size-4 accent-cyan-500"/>Importante</label>
            <label className="flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm font-medium text-emerald-100"><input type="checkbox" name={`item_completed_${key}`} className="size-4 accent-emerald-500"/>Feito</label>
            {items.length > 1 && <button type="button" onClick={() => setItems((current) => current.filter((item) => item !== key))} aria-label={`Remover item ${index + 1}`} className="rounded-lg p-2 text-rose-300 transition hover:bg-rose-400/10"><Trash2 className="size-4"/></button>}
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Select label="Tipo" name="item_type" options={itemTypes}/>
          <Select label="Atribuir a" name="item_assignee" options={developers.map((name) => ({ value: name, label: name }))}/>
          <label className="sm:col-span-2"><span className="text-sm font-medium text-slate-300">Descrição</span><textarea name="item_description" required className={`${control} min-h-28 resize-y`}/></label>
          <MultipleImageFields prefix={`item_image_${key}`}/>
        </div>
      </div>)}</div>
    </section>

    <aside className="rounded-xl border border-amber-400/25 bg-gradient-to-r from-amber-400/10 to-rose-400/5 p-4">
      <div className="flex items-start gap-3"><Star className="mt-0.5 size-5 shrink-0 text-amber-300"/><div><p className="text-sm font-bold uppercase tracking-wide text-amber-100">Itens importantes são prioridade máxima</p><p className="mt-1 text-sm leading-6 text-slate-300">Um item marcado como <strong>Importante</strong> deve receber atenção máxima, mesmo quando estiver dentro de uma demanda de prioridade Média, Baixa ou ainda não definida. Use essa marcação somente para itens realmente críticos.</p></div></div>
    </aside>

    <div className="flex flex-wrap justify-end gap-3 border-t border-slate-700/60 py-4"><button type="submit" name="intent" value="draft" formNoValidate className="focus-ring rounded-lg border border-violet-400/30 bg-violet-400/10 px-5 py-2.5 text-sm font-semibold text-violet-100 hover:bg-violet-400/15">Salvar como rascunho</button><SubmitButton/></div>
  </form>;
}

function PriorityGuide({ label, className, children }: { label: string; className: string; children: React.ReactNode }) {
  return <div className={`rounded-lg border p-3 ${className}`}><p className="font-mono text-xs font-bold uppercase tracking-wide">{label}</p><p className="mt-1.5 text-xs leading-5 text-slate-300">{children}</p></div>;
}

function Field({ label, name, type = "text", required, className = "" }: { label: string; name: string; type?: string; required?: boolean; className?: string }) {
  return <label className={className}><span className="text-sm font-medium text-slate-300">{label}</span><input name={name} type={type} required={required} className={control}/></label>;
}

function Select({ label, name, options }: { label: string; name: string; options: { value: string; label: string }[] }) {
  return <label><span className="text-sm font-medium text-slate-300">{label}</span><select name={name} className={control}><option value="">Não definido</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}
