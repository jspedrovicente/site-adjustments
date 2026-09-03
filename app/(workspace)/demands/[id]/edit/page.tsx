import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getDemand, getDemands } from "@/lib/data/demands";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { SubmitButton } from "@/components/submit-button";
import { MultipleImageFields } from "@/components/multiple-image-fields";
import { DraftNewItems } from "@/components/draft-new-items";
import { updateDemand } from "../../actions";
const developers = [
  "Vitor Moraes",
  "Lauro",
  "José",
  "Marco",
  "Elvis",
  "Wanderson",
];
const itemTypes = [
  { value: "change", label: "Ajuste" },
  { value: "question", label: "Dúvida" },
  { value: "reference", label: "Referência" },
  { value: "figma", label: "Figma" },
  { value: "other", label: "Outro" },
];
const itemResolutions = [
  { value: "pending", label: "Pendente" },
  { value: "done", label: "Concluído" },
  { value: "done_with_caveats", label: "Concluído com ressalvas" },
  { value: "business_rule_conflict", label: "Quebra regra de negócio" },
  { value: "future_version", label: "Item para futura versão" },
];
export default async function EditDemandPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [demand, demands, categoryResult] = await Promise.all([
    getDemand(id),
    getDemands(),
    supabase.from("adjustment_categories").select("id,name").order("name"),
  ]);
  if (!demand) notFound();
  const priorities = [
    ...new Set([
      "Alta",
      "Média",
      "Baixa",
      ...demands.map((row) => row.priority),
    ]),
  ];
  const statuses = [...new Set(demands.map((row) => row.status))];
  return (
    <>
      <PageHeader
        eyebrow="Edição"
        title={demand.title}
        description="Atualize os dados gerais e os itens desta demanda."
      />
      <main className="p-5 sm:p-8 lg:p-10">
        <form action={updateDemand} className="mx-auto max-w-5xl space-y-6">
          <input type="hidden" name="id" value={demand.id} />
          <section className="panel rounded-lg p-5 sm:p-7">
            <h2 className="mb-5 text-lg font-semibold">Informações gerais</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Título"
                name="title"
                defaultValue={demand.title}
                required
                className="sm:col-span-2"
              />
              <Textarea
                label="Descrição geral da demanda"
                name="description"
                defaultValue={demand.description}
                className="sm:col-span-2"
              />
              <Select
                label="Categoria"
                name="category_id"
                defaultValue={demand.categoryId}
                options={(categoryResult.data ?? []).map((category) => ({
                  value: category.id,
                  label: category.name,
                }))}
              />
              <Select
                label="Responsável"
                name="developer"
                defaultValue={demand.developer}
                options={developers.map((value) => ({ value, label: value }))}
              />
              <Select
                label="Prioridade"
                name="priority"
                defaultValue={demand.priority}
                options={priorities.map((value) => ({ value, label: value }))}
              />
              <Select
                label="Status"
                name="status"
                defaultValue={demand.status}
                options={statuses.map((value) => ({ value, label: value }))}
              />
              <Field
                label="Prazo"
                name="deadline"
                type="date"
                defaultValue={demand.deadline?.slice(0, 10)}
              />
              <Field
                label="Resultado da validação"
                name="validation_result"
                defaultValue={demand.validationResult}
              />
              <Textarea
                label="Observações da validação"
                name="validation_notes"
                defaultValue={demand.validationNotes}
                className="sm:col-span-2"
              />
            </div>
          </section>
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Itens</h2>
              <span className="text-sm text-slate-500">
                {demand.items.length} itens
              </span>
            </div>
            <div className="space-y-4">
              {demand.items.map((item, index) => (
                <div key={item.id} className="panel rounded-lg p-5 sm:p-7">
                  <input type="hidden" name="item_id" value={item.id} />
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                      Item {item.number ?? index + 1}
                    </p>
                    <Check
                      name={`important_${item.id}`}
                      checked={item.annotations.some(
                        (annotation) => annotation.semantic === "important",
                      )}
                      label="Importante"
                      color="blue"
                    />
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Select
                      label="Tipo"
                      name={`item_type_${item.id}`}
                      defaultValue={item.type}
                      options={itemTypes}
                    />
                    <Select
                      label="Atribuir item a"
                      name={`assignee_${item.id}`}
                      defaultValue={item.assignee}
                      options={developers.map((value) => ({
                        value,
                        label: value,
                      }))}
                    />
                    <Select
                      label="Situação do item"
                      name={`resolution_${item.id}`}
                      defaultValue={item.resolution}
                      options={itemResolutions}
                    />
                    <div className="self-end rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-800">
                      Ressalvas e quebra de regra exigem justificativa e contam
                      como concluído.
                    </div>
                    <Textarea
                      label="Descrição"
                      name={`description_${item.id}`}
                      defaultValue={item.description}
                      className="sm:col-span-2"
                    />
                    <Textarea
                      label="Resposta ou justificativa do desenvolvimento"
                      name={`developer_response_${item.id}`}
                      defaultValue={item.developerResponse}
                      className="sm:col-span-2"
                    />
                    <MultipleImageFields prefix={`image_${item.id}`} />
                  </div>
                </div>
              ))}
            </div>
          </section>
          {demand.status.startsWith("Rascunho") && <DraftNewItems />}
          <div className="sticky bottom-0 flex items-center justify-between border-t bg-slate-50/95 py-4">
            <Link
              href={`/demands/${id}`}
              className="flex items-center gap-2 text-sm font-semibold"
            >
              <ArrowLeft className="size-4" />
              Cancelar
            </Link>
            <div className="flex flex-wrap gap-3"><SubmitButton />{demand.status.startsWith("Rascunho") && <button type="submit" name="intent" value="submit-draft" className="focus-ring rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500">Enviar para análise</button>}</div>
          </div>
        </form>
      </main>
    </>
  );
}
const control =
  "focus-ring mt-1.5 w-full rounded-md border bg-white px-3 py-2.5 text-sm";
function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  className = "",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="text-sm font-medium">{label}</span>
      <input
        className={control}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
      />
    </label>
  );
}
function Textarea({
  label,
  name,
  defaultValue,
  className = "",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="text-sm font-medium">{label}</span>
      <textarea
        className={`${control} min-h-28 resize-y`}
        name={name}
        defaultValue={defaultValue}
      />
    </label>
  );
}
function Select({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label>
      <span className="text-sm font-medium">{label}</span>
      <select className={control} name={name} defaultValue={defaultValue ?? ""}>
        <option value="">Não definido</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
function Check({
  name,
  checked,
  label,
  color,
}: {
  name: string;
  checked: boolean;
  label: string;
  color: "blue" | "emerald";
}) {
  return (
    <label
      className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium ${color === "blue" ? "border-blue-200 bg-blue-50 text-blue-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}
    >
      <input
        type="checkbox"
        name={name}
        defaultChecked={checked}
        className="size-4"
      />
      {label}
    </label>
  );
}
