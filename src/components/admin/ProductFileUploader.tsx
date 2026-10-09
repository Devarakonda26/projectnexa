"use client";

import { useRef, useState } from "react";
import { finalizeProductFileUpload, prepareProductFileUpload } from "@/app/admin/products/actions";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export function ProductFileUploader({ productId }: { productId: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = input.current?.files?.[0];
    if (!file) return setMessage({ kind: "error", text: "Choose a file first." });
    setBusy(true);
    setMessage(null);
    try {
      const prep = await prepareProductFileUpload({ productId, name: file.name, size: file.size, type: file.type });
      if (!prep.ok) return setMessage({ kind: "error", text: prep.error });

      const { error } = await createBrowserSupabase().storage.from("product-files").uploadToSignedUrl(prep.path, prep.token, file, { contentType: prep.contentType });
      if (error) return setMessage({ kind: "error", text: "Upload failed. Check your connection and try again." });

      const done = await finalizeProductFileUpload({ productId, path: prep.path, name: file.name, contentType: prep.contentType, version: prep.version });
      setMessage(done.ok ? { kind: "ok", text: done.message ?? "Uploaded." } : { kind: "error", text: done.error ?? "Could not record the file." });
      if (done.ok && input.current) input.current.value = "";
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <input ref={input} type="file" accept=".zip,.pdf,.7z,.gz,.tgz" className="block w-full text-sm" />
      <p className="text-xs text-slate-600">ZIP, PDF, 7z or GZ up to 200 MB. Each upload becomes a new version; customers always get the newest one.</p>
      <button disabled={busy} className="rounded-md bg-blue-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60">{busy ? "Uploading…" : "Upload file"}</button>
      {message ? <p role={message.kind === "error" ? "alert" : "status"} className={`text-sm ${message.kind === "error" ? "text-red-700" : "text-green-800"}`}>{message.text}</p> : null}
    </form>
  );
}
