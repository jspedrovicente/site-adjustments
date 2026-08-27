"use client";
import { useFormStatus } from "react-dom";
export function SubmitButton() { const { pending } = useFormStatus(); return <button type="submit" disabled={pending} className="focus-ring rounded-md bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60">{pending ? "Salvando..." : "Salvar alterações"}</button>; }
