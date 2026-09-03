"use client";

import Link from "next/link";
import { FilePenLine, X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";

type Draft = { id: string; title: string; updatedAt?: string };

export function DraftPicker({ drafts }: { drafts: Draft[] }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(drafts[0]?.id ?? "");
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="focus-ring flex items-center gap-2 rounded-md border border-violet-400/30 bg-violet-400/10 px-4 py-2.5 text-sm font-semibold text-violet-100 hover:bg-violet-400/15"
      >
        <FilePenLine className="size-4" />
        Continuar rascunho
        {drafts.length > 0 && (
          <span className="rounded-full bg-violet-300/15 px-1.5 text-xs">
            {drafts.length}
          </span>
        )}
      </button>
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="draft-title"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setOpen(false);
            }}
          >
            <div className="panel w-full max-w-lg rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-xs font-semibold uppercase tracking-wide text-violet-300">
                    Rascunhos
                  </p>
                  <h2
                    id="draft-title"
                    className="mt-1 text-xl font-semibold text-white"
                  >
                    Continuar uma demanda
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fechar"
                  className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
                >
                  <X className="size-5" />
                </button>
              </div>
              {drafts.length ? (
                <>
                  <label className="mt-6 block">
                    <span className="text-sm font-medium text-slate-300">
                      Selecione o rascunho
                    </span>
                    <select
                      value={selected}
                      onChange={(event) => setSelected(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-3 text-sm text-white"
                    >
                      {drafts.map((draft) => (
                        <option key={draft.id} value={draft.id}>
                          {draft.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="mt-3 space-y-2">
                    {drafts
                      .filter((draft) => draft.id === selected)
                      .map((draft) => (
                        <p key={draft.id} className="text-xs text-slate-400">
                          Última alteração:{" "}
                          {draft.updatedAt
                            ? new Date(draft.updatedAt).toLocaleString("pt-BR")
                            : "não informada"}
                        </p>
                      ))}
                  </div>
                  <div className="mt-6 flex justify-end">
                    <Link
                      href={`/demands/${selected}/edit`}
                      onClick={() => setOpen(false)}
                      className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white"
                    >
                      Abrir rascunho
                    </Link>
                  </div>
                </>
              ) : (
                <div className="mt-6 rounded-lg border border-slate-700 bg-slate-950/25 p-6 text-center">
                  <p className="text-sm font-medium text-white">
                    Nenhum rascunho salvo
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Crie uma nova demanda e escolha “Salvar como rascunho”.
                  </p>
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
