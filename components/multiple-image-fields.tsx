"use client";

import { useState } from "react";
import { ClipboardPaste, ImagePlus, Trash2 } from "lucide-react";

const roles = [
  { value: "other", label: "Imagem / referência" },
  { value: "current_state", label: "Como está" },
  { value: "expected_state", label: "Como deve ficar" },
  { value: "reference", label: "Referência" },
];

type ImageRow = { id: string; pastedFile?: File };

export function MultipleImageFields({ prefix }: { prefix: string }) {
  const [rows, setRows] = useState<ImageRow[]>([]);

  function addEmptyRow() {
    setRows((current) => [...current, { id: crypto.randomUUID() }]);
  }

  function handlePaste(event: React.ClipboardEvent<HTMLElement>) {
    const files = Array.from(event.clipboardData.items)
      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null);

    if (!files.length) return;
    event.preventDefault();
    const timestamp = Date.now();
    setRows((current) => [
      ...current,
      ...files.map((file, index) => ({
        id: crypto.randomUUID(),
        pastedFile: new File(
          [file],
          file.name && file.name !== "image.png" ? file.name : `imagem-colada-${timestamp}-${index + 1}.${extensionFor(file.type)}`,
          { type: file.type || "image/png", lastModified: file.lastModified || timestamp },
        ),
      })),
    ]);
  }

  function replaceWithSelectedFile(id: string) {
    setRows((current) => current.map((row) => row.id === id ? { id: row.id } : row));
  }

  return <fieldset className="sm:col-span-2" onPaste={handlePaste}>
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
      <legend className="text-sm font-medium text-slate-300">Imagens do item</legend>
      <button type="button" onClick={addEmptyRow} className="flex items-center gap-1.5 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/15"><ImagePlus className="size-4"/>Adicionar imagem</button>
    </div>

    <div tabIndex={0} className="focus-ring mb-3 flex cursor-text items-center gap-3 rounded-lg border border-dashed border-violet-400/30 bg-violet-400/5 px-4 py-3 text-left transition hover:border-violet-400/45 hover:bg-violet-400/10">
      <span className="rounded-md bg-violet-400/10 p-2 text-violet-200"><ClipboardPaste className="size-4"/></span>
      <div><p className="text-xs font-semibold text-violet-100">Cole uma imagem diretamente</p><p className="mt-0.5 text-[11px] text-slate-400">Copie uma captura ou imagem e pressione <kbd className="rounded border border-slate-600 bg-slate-800 px-1.5 py-0.5 font-mono text-slate-300">Ctrl+V</kbd> nesta área.</p></div>
    </div>

    {rows.length ? <div className="space-y-2">{rows.map((row, index) => <div key={row.id} className="grid gap-2 rounded-lg border border-slate-700/70 bg-slate-950/25 p-3 sm:grid-cols-[minmax(0,1fr)_180px_auto]">
      <div>
        <input
          ref={(input) => assignPastedFile(input, row.pastedFile)}
          type="file"
          name={`${prefix}_file`}
          accept="image/*"
          required
          onChange={() => replaceWithSelectedFile(row.id)}
          className="min-w-0 w-full rounded-lg border px-2 py-2 text-xs file:mr-2 file:rounded-md file:border-0 file:bg-indigo-500/15 file:px-2 file:py-1 file:text-indigo-100"
        />
        {row.pastedFile && <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-emerald-300"><ClipboardPaste className="size-3"/>Imagem colada e pronta para envio</p>}
      </div>
      <select name={`${prefix}_role`} defaultValue="other" aria-label={`Papel da imagem ${index + 1}`} className="focus-ring h-10 rounded-lg border px-3 py-2 text-sm">{roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select>
      <button type="button" onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))} aria-label={`Remover imagem ${index + 1}`} className="grid size-10 place-items-center rounded-lg text-rose-300 transition hover:bg-rose-400/10"><Trash2 className="size-4"/></button>
    </div>)}</div> : <p className="rounded-lg border border-dashed border-slate-700 p-4 text-center text-xs text-slate-500">Nenhuma imagem adicionada ou colada.</p>}
  </fieldset>;
}

function assignPastedFile(input: HTMLInputElement | null, file?: File) {
  if (!input || !file || input.dataset.pastedFile === `${file.name}-${file.lastModified}`) return;
  const transfer = new DataTransfer();
  transfer.items.add(file);
  input.files = transfer.files;
  input.dataset.pastedFile = `${file.name}-${file.lastModified}`;
}

function extensionFor(type: string) {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  return "png";
}
