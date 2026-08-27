import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { categoryFromRow, demandFromRow, itemFromRow, type AttachmentRole, type Demand } from "./model";

export const getDemands = cache(async (): Promise<Demand[]> => {
  const supabase = await createClient();
  const [demandResult, categoryResult, itemResult, attachmentResult, joinResult, linkResult, annotationResult] = await Promise.all([
    supabase.from("adjustment_demands").select("*").order("source_order"),
    supabase.from("adjustment_categories").select("*").order("name"),
    supabase.from("adjustment_items").select("*").order("sort_order"),
    supabase.from("adjustment_attachments").select("*"),
    supabase.from("adjustment_item_attachments").select("*"),
    supabase.from("adjustment_links").select("*"),
    supabase.from("adjustment_annotations").select("*").order("span_index"),
  ]);
  const failed = [demandResult, categoryResult, itemResult, attachmentResult, joinResult, linkResult, annotationResult].find((result) => result.error);
  if (failed?.error) throw new Error(`Não foi possível carregar as demandas: ${failed.error.message}`);
  const categories = (categoryResult.data ?? []).map(categoryFromRow);
  const demands = (demandResult.data ?? []).map(demandFromRow);
  const items = (itemResult.data ?? []).map(itemFromRow);
  const itemMap = new Map(items.map((item) => [item.id, item]));
  const attachments = new Map((attachmentResult.data ?? []).map((row) => [row.id, row]));
  for (const relation of joinResult.data ?? []) {
    if (!relation.item_id) continue;
    const item = itemMap.get(relation.item_id), attachment = attachments.get(relation.attachment_id);
    if (item && attachment) item.attachments.push({ id: attachment.id, path: attachment.storage_path, name: attachment.filename, role: relation.role as AttachmentRole, referenceLabel: relation.reference_label ?? undefined, sharedReference: relation.shared_reference });
  }
  for (const row of linkResult.data ?? []) { if (!row.item_id) continue; itemMap.get(row.item_id)?.links.push({ id: row.id, url: row.url, label: row.link_type || undefined }); }
  for (const row of annotationResult.data ?? []) { itemMap.get(row.item_id)?.annotations.push({ id: row.id, semantic: row.semantic, text: row.text ?? undefined }); }
  for (const demand of demands) { demand.category = categories.find((category) => category.id === demand.categoryId); demand.items = items.filter((item) => item.demandId === demand.id); }
  return demands;
});

export async function getDemand(id: string) { return (await getDemands()).find((demand) => demand.id === id) ?? null; }
export async function signDemandImages(demand: Demand): Promise<Demand> { const supabase = await createClient(); const paths = [...new Set(demand.items.flatMap((item) => item.attachments.map((attachment) => attachment.path)).filter(Boolean))]; if (!paths.length) return demand; const { data } = await supabase.storage.from("site-adjustments").createSignedUrls(paths, 3600); const urls = new Map((data ?? []).map((entry) => [entry.path, entry.signedUrl ?? undefined])); return { ...demand, items: demand.items.map((item) => ({ ...item, attachments: item.attachments.map((attachment) => ({ ...attachment, signedUrl: urls.get(attachment.path) })) })) }; }
