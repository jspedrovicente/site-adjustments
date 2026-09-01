"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/database.types";

const optional = (formData: FormData, name: string) => {
  const value = formData.get(name);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
};

export async function updateDemand(formData: FormData) {
  const id = optional(formData, "id");
  const title = optional(formData, "title");
  if (!id || !title) throw new Error("O título da demanda é obrigatório.");

  const supabase = await createClient();
  const { error: demandError } = await supabase.from("adjustment_demands").update({
    title,
    heading_raw: optional(formData, "description"),
    category_id: optional(formData, "category_id"),
    priority: optional(formData, "priority"),
    status: optional(formData, "status"),
    developer: optional(formData, "developer"),
    deadline: optional(formData, "deadline"),
    validation_result: optional(formData, "validation_result"),
    validation_notes: optional(formData, "validation_notes"),
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (demandError) throw new Error(`Não foi possível atualizar a demanda: ${demandError.message}`);

  const itemIds = formData.getAll("item_id").filter((value): value is string => typeof value === "string");
  const { data: currentItems, error: readError } = await supabase.from("adjustment_items").select("id,semantics").in("id", itemIds).eq("demand_id", id);
  if (readError) throw new Error(`Não foi possível ler o estado dos itens: ${readError.message}`);
  const currentById = new Map((currentItems ?? []).map((item) => [item.id, item.semantics]));
  for (const itemId of itemIds) {
    const resolution = optional(formData, `resolution_${itemId}`) ?? "pending";
    const response = optional(formData, `developer_response_${itemId}`);
    if (!["pending", "done", "done_with_caveats", "business_rule_conflict", "future_version"].includes(resolution)) throw new Error("Estado do item inválido.");
    if (["done_with_caveats", "business_rule_conflict", "future_version"].includes(resolution) && !response) throw new Error("Escreva uma justificativa para os itens com ressalvas, quebra de regra ou destinados a uma futura versão.");
  }
  const results = await Promise.all(itemIds.map((itemId) => supabase.from("adjustment_items").update({
    item_type: optional(formData, `item_type_${itemId}`) ?? "other",
    description: optional(formData, `description_${itemId}`),
    developer_response: optional(formData, `developer_response_${itemId}`),
    semantics: withItemMetadata(currentById.get(itemId), optional(formData, `resolution_${itemId}`) ?? "pending", optional(formData, `assignee_${itemId}`)),
    updated_at: new Date().toISOString(),
  }).eq("id", itemId).eq("demand_id", id)));
  const itemError = results.find((result) => result.error)?.error;
  if (itemError) throw new Error(`A demanda foi atualizada, mas um item falhou: ${itemError.message}`);
  await finalizeIfAllItemsResolved(supabase, id);
  const { data: importantAnnotations, error: annotationReadError } = await supabase.from("adjustment_annotations").select("id,item_id").in("item_id", itemIds).eq("semantic", "important");
  if (annotationReadError) throw new Error(`Não foi possível ler as marcações importantes: ${annotationReadError.message}`);
  for (const itemId of itemIds) {
    const shouldBeImportant = formData.get(`important_${itemId}`) === "on";
    const existing = (importantAnnotations ?? []).filter((annotation) => annotation.item_id === itemId);
    if (shouldBeImportant && existing.length === 0) { const { error } = await supabase.from("adjustment_annotations").insert({ item_id: itemId, semantic: "important", span_index: 0, text: null, highlight: null }); if (error) throw new Error(`Não foi possível marcar o item como importante: ${error.message}`); }
    if (!shouldBeImportant && existing.length > 0) { const { error } = await supabase.from("adjustment_annotations").delete().in("id", existing.map((annotation) => annotation.id)); if (error) throw new Error(`Não foi possível remover a marcação importante: ${error.message}`); }
  }
  for (const itemId of itemIds) { const files = formData.getAll(`image_${itemId}_file`); const roles = formData.getAll(`image_${itemId}_role`); for (let index = 0; index < files.length; index++) { const file = files[index], role = roles[index]; if (file instanceof File && file.size > 0) await uploadItemImage(supabase, id, itemId, file, typeof role === "string" ? role : "other"); } }

  revalidatePath("/dashboard");
  revalidatePath("/daily");
  revalidatePath("/demands");
  revalidatePath("/future-versions");
  revalidatePath("/post-go-live");
  revalidatePath(`/demands/${id}`);
  redirect(`/demands/${id}`);
}

export async function createDemand(formData: FormData) {
  const title = optional(formData, "title");
  const postGoLive = formData.get("post_go_live") === "on";
  if (!title) throw new Error("O título da demanda é obrigatório.");
  const descriptions = formData.getAll("item_description").filter((value): value is string => typeof value === "string");
  const types = formData.getAll("item_type").filter((value): value is string => typeof value === "string");
  const assignees = formData.getAll("item_assignee").filter((value): value is string => typeof value === "string");
  const keys = formData.getAll("item_key").filter((value): value is string => typeof value === "string");
  const validItems = descriptions.map((description, index) => { const key = keys[index]; return { id: crypto.randomUUID(), key, description: description.trim(), type: types[index] || "change", assignee: assignees[index]?.trim() || null, completed: formData.get(`item_completed_${key}`) === "on", important: formData.get(`item_important_${key}`) === "on" }; }).filter((item) => item.description);
  if (!validItems.length) throw new Error("Adicione pelo menos um item à demanda.");
  const supabase = await createClient();
  const { data: latest } = await supabase.from("adjustment_demands").select("source_order").order("source_order", { ascending: false }).limit(1).maybeSingle();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const { error: demandError } = await supabase.from("adjustment_demands").insert({ id, title, heading_raw: optional(formData, "description"), category_id: optional(formData, "category_id"), priority: optional(formData, "priority"), status: postGoLive ? "Pendente de análise · Pós-go-live" : "Pendente de análise", developer: optional(formData, "developer"), deadline: optional(formData, "deadline"), source_key: `manual-${id}`, source_order: (latest?.source_order ?? 0) + 1, created_at: now, updated_at: now });
  if (demandError) throw new Error(`Não foi possível criar a demanda: ${demandError.message}`);
  const { error: itemsError } = await supabase.from("adjustment_items").insert(validItems.map((item, index) => ({ id: item.id, demand_id: id, item_type: item.type, description: item.description, semantics: [...(item.completed ? ["done" as const] : []), ...(item.assignee ? [{ semantic: "assignee", value: item.assignee }] : [])], sort_order: index + 1, source_key: `manual-${id}-${index + 1}`, created_at: now, updated_at: now })));
  if (itemsError) { await supabase.from("adjustment_demands").delete().eq("id", id); throw new Error(`Não foi possível criar os itens: ${itemsError.message}`); }
  const importantItems = validItems.filter((item) => item.important);
  if (importantItems.length) { const { error } = await supabase.from("adjustment_annotations").insert(importantItems.map((item) => ({ item_id: item.id, semantic: "important", span_index: 0, text: null, highlight: null }))); if (error) throw new Error(`A demanda foi criada, mas as marcações importantes falharam: ${error.message}`); }
  for (const item of validItems) { const files = formData.getAll(`item_image_${item.key}_file`); const roles = formData.getAll(`item_image_${item.key}_role`); for (let index = 0; index < files.length; index++) { const file = files[index], role = roles[index]; if (file instanceof File && file.size > 0) await uploadItemImage(supabase, id, item.id, file, typeof role === "string" ? role : "other"); } }
  revalidatePath("/approvals");
  redirect("/approvals?created=true");
}

function withItemMetadata(value: Json | undefined, resolution: string, assignee: string | null): Json {
  const values = Array.isArray(value) ? value : value == null ? [] : [value];
  const preserved = values.filter((entry) => entry !== "done" && !(typeof entry === "object" && entry !== null && !Array.isArray(entry) && (entry.semantic === "done" || entry.semantic === "assignee" || entry.semantic === "completion")));
  const completion: Json[] = resolution === "done" ? ["done"] : resolution === "pending" ? [] : [{ semantic: "completion", value: resolution }];
  return [...preserved, ...completion, ...(assignee ? [{ semantic: "assignee", value: assignee }] : [])];
}

export async function updateItemResolution(formData: FormData) {
  const demandId = optional(formData, "demand_id"), itemId = optional(formData, "item_id"), resolution = optional(formData, "resolution") ?? "pending", response = optional(formData, "developer_response");
  if (!demandId || !itemId || !["pending", "done", "done_with_caveats", "business_rule_conflict", "future_version"].includes(resolution)) throw new Error("Estado do item inválido.");
  if (["done_with_caveats", "business_rule_conflict", "future_version"].includes(resolution) && !response) throw new Error("Escreva uma justificativa para concluir o item com ressalvas, quebra de regra ou encaminhá-lo para uma futura versão.");
  const supabase = await createClient();
  const { data: current, error: readError } = await supabase.from("adjustment_items").select("semantics").eq("id", itemId).eq("demand_id", demandId).single();
  if (readError) throw new Error(`Não foi possível ler o item: ${readError.message}`);
  const values = Array.isArray(current.semantics) ? current.semantics : [];
  const preserved = values.filter((entry) => entry !== "done" && !(typeof entry === "object" && entry !== null && !Array.isArray(entry) && (entry.semantic === "done" || entry.semantic === "completion")));
  const marker: Json[] = resolution === "done" ? ["done"] : resolution === "pending" ? [] : [{ semantic: "completion", value: resolution }];
  const { data, error } = await supabase.from("adjustment_items").update({ semantics: [...preserved, ...marker], developer_response: response, updated_at: new Date().toISOString() }).eq("id", itemId).eq("demand_id", demandId).select("id").single();
  if (error || !data) throw new Error(`Não foi possível atualizar o estado do item: ${error?.message ?? "registro não atualizado"}`);
  await finalizeIfAllItemsResolved(supabase, demandId);
  revalidatePath(`/demands/${demandId}`); revalidatePath("/demands"); revalidatePath("/dashboard"); revalidatePath("/daily"); revalidatePath("/confirmations"); revalidatePath("/future-versions"); revalidatePath("/post-go-live");
  redirect(`/demands/${demandId}`);
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
async function finalizeIfAllItemsResolved(supabase: SupabaseClient, demandId: string) {
  const { data: items, error } = await supabase.from("adjustment_items").select("semantics").eq("demand_id", demandId);
  if (error) throw new Error(`Não foi possível verificar a conclusão da demanda: ${error.message}`);
  if (!items?.length) return;
  const allResolved = items.every((item) => Array.isArray(item.semantics) && item.semantics.some((value) => value === "done" || (typeof value === "object" && value !== null && !Array.isArray(value) && value.semantic === "completion" && value.value !== "pending")));
  if (!allResolved) return;
  const { error: finalizeError } = await supabase.from("adjustment_demands").update({ status: "Finalizada", updated_at: new Date().toISOString() }).eq("id", demandId);
  if (finalizeError) throw new Error(`Os itens foram atualizados, mas não foi possível finalizar a demanda: ${finalizeError.message}`);
}
async function uploadItemImage(supabase: SupabaseClient, demandId: string, itemId: string, file: File, role: string) {
  if (!file.type.startsWith("image/")) throw new Error("Somente arquivos de imagem são permitidos.");
  if (file.size > 10 * 1024 * 1024) throw new Error("A imagem deve ter no máximo 10 MB.");
  const extension = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "bin";
  const path = `demands/${demandId}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from("site-adjustments").upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) throw new Error(`Não foi possível enviar ${file.name}: ${uploadError.message}`);
  const { data: attachment, error: attachmentError } = await supabase.from("adjustment_attachments").insert({ filename: file.name, mime_type: file.type, size_bytes: file.size, source_media: `manual:${path}`, storage_bucket: "site-adjustments", storage_path: path }).select("id").single();
  if (attachmentError) { await supabase.storage.from("site-adjustments").remove([path]); throw new Error(`Não foi possível registrar a imagem: ${attachmentError.message}`); }
  const { error: relationError } = await supabase.from("adjustment_item_attachments").insert({ attachment_id: attachment.id, demand_id: demandId, item_id: itemId, role, shared_reference: false });
  if (relationError) { await supabase.from("adjustment_attachments").delete().eq("id", attachment.id); await supabase.storage.from("site-adjustments").remove([path]); throw new Error(`Não foi possível associar a imagem ao item: ${relationError.message}`); }
}
