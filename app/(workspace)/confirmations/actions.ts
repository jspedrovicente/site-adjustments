"use server";
import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/database.types";

const isCompleted = (value: Json) => value === "done" || (typeof value === "object" && value !== null && !Array.isArray(value) && (value.semantic === "done" || value.semantic === "completion"));

export async function requestItemFeedback(formData: FormData) {
  const demandId = formData.get("demand_id"), itemId = formData.get("item_id"), rawContent = formData.get("content");
  const content = typeof rawContent === "string" ? rawContent.trim() : "";
  const detailPath = typeof demandId === "string" ? `/demands/${demandId}` : "/confirmations";
  const returnTo = formData.get("return_to") === "detail" ? detailPath : "/confirmations";
  if (typeof demandId !== "string" || typeof itemId !== "string" || content.length < 3) redirect(`${returnTo}?error=feedback-invalid`);

  const supabase = await createClient();
  const { data: demand } = await supabase.from("adjustment_demands").select("id,status").eq("id", demandId).maybeSingle();
  const { data: item } = await supabase.from("adjustment_items").select("id").eq("id", itemId).eq("demand_id", demandId).maybeSingle();
  if (!demand || !item || demand.status === "Finalizada" || demand.status === "Ajustes solicitados") redirect(`${returnTo}?error=feedback-invalid`);

  const now = new Date().toISOString();
  const { error } = await supabase.from("adjustment_item_feedback").insert({ demand_id: demandId, item_id: itemId, content, status: "draft", created_at: now, updated_at: now });
  if (error) redirect(`${returnTo}?error=feedback-failed`);

  revalidatePath("/confirmations"); revalidatePath(`/demands/${demandId}`);
  redirect(`${returnTo}?feedback-added=true`);
}

export async function returnDemandForFeedback(formData: FormData) {
  const demandId = formData.get("demand_id");
  if (typeof demandId !== "string") redirect("/confirmations?error=feedback-invalid");
  const detailPath = `/demands/${demandId}`;
  const returnTo = formData.get("return_to") === "detail" ? detailPath : "/confirmations";
  const supabase = await createClient();
  const { data: drafts, error: draftError } = await supabase.from("adjustment_item_feedback").select("id,item_id").eq("demand_id", demandId).eq("status", "draft");
  if (draftError || !drafts?.length) redirect(`${returnTo}?error=no-feedback`);

  const now = new Date().toISOString();
  const { error: feedbackError } = await supabase.from("adjustment_item_feedback").update({ status: "pending", updated_at: now }).eq("demand_id", demandId).eq("status", "draft");
  const { error: demandError } = feedbackError ? { error: feedbackError } : await supabase.from("adjustment_demands").update({ status: "Ajustes solicitados", updated_at: now }).eq("id", demandId).neq("status", "Finalizada");
  if (feedbackError || demandError) redirect(`${returnTo}?error=feedback-failed`);

  revalidatePath("/confirmations"); revalidatePath("/demands"); revalidatePath(detailPath); revalidatePath("/dashboard"); revalidatePath("/daily");
  redirect("/confirmations?feedback-requested=true");
}

export async function setDemandProduction(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") redirect("/confirmations?error=invalid");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("adjustment_demands")
    .update({ in_production: formData.get("in_production") === "on", updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error || !data) redirect("/confirmations?error=production-update-failed");
  revalidatePath("/confirmations");
  revalidatePath("/demands");
  revalidatePath("/dashboard");
}

export async function setAllDemandsProduction(formData: FormData) {
  const ids = formData.getAll("id").filter((id): id is string => typeof id === "string" && id.length > 0);
  if (!ids.length) redirect("/confirmations?error=invalid");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("adjustment_demands")
    .update({ in_production: true, updated_at: new Date().toISOString() })
    .in("id", ids)
    .select("id");

  if (error || data.length !== ids.length) redirect("/confirmations?error=production-update-failed");
  revalidatePath("/confirmations");
  revalidatePath("/demands");
  revalidatePath("/dashboard");
}

export async function finalizeDemand(formData: FormData) {
  const id = formData.get("id"), password = formData.get("password"), expected = process.env.COMPLETION_PASSWORD;
  if (typeof id !== "string" || typeof password !== "string") redirect("/confirmations?error=invalid");
  if (!expected) redirect("/confirmations?error=not-configured");
  const received = Buffer.from(password), configured = Buffer.from(expected);
  if (received.length !== configured.length || !timingSafeEqual(received, configured)) redirect("/confirmations?error=invalid-password");

  const supabase = await createClient();
  const [{ data: items, error: readError }, { count: pendingFeedback, error: feedbackError }] = await Promise.all([
    supabase.from("adjustment_items").select("semantics").eq("demand_id", id),
    supabase.from("adjustment_item_feedback").select("id", { count: "exact", head: true }).eq("demand_id", id).neq("status", "resolved"),
  ]);
  if (readError || feedbackError || !items?.length) redirect("/confirmations?error=update-failed");
  const allDone = items.every((item) => Array.isArray(item.semantics) && item.semantics.some(isCompleted));
  if (!allDone || pendingFeedback) redirect("/confirmations?error=items-pending");

  const { data, error } = await supabase.from("adjustment_demands").update({ status: "Finalizada", updated_at: new Date().toISOString() }).eq("id", id).neq("status", "Finalizada").select("id").maybeSingle();
  if (error || !data) redirect("/confirmations?error=update-failed");
  revalidatePath("/confirmations"); revalidatePath("/demands"); revalidatePath("/dashboard"); revalidatePath("/post-go-live");
  redirect("/confirmations?finalized=true");
}
