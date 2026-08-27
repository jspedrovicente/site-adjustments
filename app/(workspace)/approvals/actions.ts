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
  const { data, error } = await supabase.from("adjustment_demands").update({ status: "Novo", updated_at: new Date().toISOString() }).eq("id", id).eq("status", "Pendente de aprovação").select("id").maybeSingle();
  if (error || !data) redirect("/approvals?error=update-failed");
  revalidatePath("/approvals"); revalidatePath("/demands"); revalidatePath("/dashboard");
  redirect("/approvals?approved=true");
}
