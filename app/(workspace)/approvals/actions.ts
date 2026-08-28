"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { timingSafeEqual } from "node:crypto";
import { createClient } from "@/lib/supabase/server";

export async function approveDemand(formData: FormData) {
  const id = formData.get("id"), password = formData.get("password"), expected = process.env.APPROVAL_PASSWORD;
  if (typeof id !== "string" || typeof password !== "string") redirect("/approvals?error=invalid");
  if (!expected) redirect("/approvals?error=not-configured");
  const receivedBuffer = Buffer.from(password), expectedBuffer = Buffer.from(expected);
  if (receivedBuffer.length !== expectedBuffer.length || !timingSafeEqual(receivedBuffer, expectedBuffer)) redirect("/approvals?error=invalid-password");
  const supabase = await createClient();
  const { data: current } = await supabase.from("adjustment_demands").select("status").eq("id", id).maybeSingle();
  if (!current || !(current.status?.startsWith("Pendente de análise") || current.status === "Pendente de aprovação")) redirect("/approvals?error=update-failed");
  const currentStatus = current.status ?? "";
  const approvedStatus = currentStatus.includes("Pós-go-live") ? "Pós-go-live" : "Novo";
  const { data, error } = await supabase.from("adjustment_demands").update({ status: approvedStatus, updated_at: new Date().toISOString() }).eq("id", id).eq("status", currentStatus).select("id").maybeSingle();
  if (error || !data) redirect("/approvals?error=update-failed");
  revalidatePath("/approvals"); revalidatePath("/demands"); revalidatePath("/dashboard"); revalidatePath("/post-go-live");
  redirect("/approvals?approved=true");
}

export async function rejectDemand(formData: FormData) {
  const id = formData.get("id"), password = formData.get("password"), reason = formData.get("reason"), expected = process.env.APPROVAL_PASSWORD;
  if (typeof id !== "string" || typeof password !== "string" || typeof reason !== "string" || !reason.trim()) redirect("/approvals?error=reason-required");
  if (!expected) redirect("/approvals?error=not-configured");
  const receivedBuffer = Buffer.from(password), expectedBuffer = Buffer.from(expected);
  if (receivedBuffer.length !== expectedBuffer.length || !timingSafeEqual(receivedBuffer, expectedBuffer)) redirect("/approvals?error=invalid-password");
  const supabase = await createClient();
  const { data: current } = await supabase.from("adjustment_demands").select("status").eq("id", id).maybeSingle();
  if (!current || !(current.status?.startsWith("Pendente de análise") || current.status === "Pendente de aprovação")) redirect("/approvals?error=update-failed");
  const currentStatus = current.status ?? "";
  const { data, error } = await supabase.from("adjustment_demands").update({ status: "Reprovada", validation_result: "Reprovada na análise", validation_notes: reason.trim(), updated_at: new Date().toISOString() }).eq("id", id).eq("status", currentStatus).select("id").maybeSingle();
  if (error || !data) redirect("/approvals?error=update-failed");
  revalidatePath("/approvals"); revalidatePath("/rejected"); revalidatePath("/demands"); revalidatePath("/dashboard");
  redirect("/approvals?rejected=true");
}
