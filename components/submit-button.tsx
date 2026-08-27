"use client";
import { useFormStatus } from "react-dom";
export function SubmitButton() { const { pending } = useFormStatus(); return <button type="submit" disabled={pending} className="focus-ring rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/25 disabled:cursor-wait disabled:opacity-60">{pending ? "Salvando..." : "Salvar alterações"}</button>; }
