import { Suspense } from "react";
import { AddressForm } from "@/components/shop/AddressForm";
import { requireUser } from "@/lib/auth/dal";
import { safeNextPath } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";
import { deleteAddressAction } from "./actions";

export const metadata = { title: "Saved addresses" };

async function Content({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await requireUser("/account/addresses");
  const next = safeNextPath((await searchParams).next, "");
  const supabase = await createClient();
  const { data } = await supabase.from("addresses").select("*").eq("user_id", user.id).order("created_at");
  return (
    <>
      <ul className="mb-8 grid gap-3 sm:grid-cols-2">
        {(data ?? []).map((a) => (
          <li key={a.id} className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
            <p className="font-medium">{a.label}{a.is_default ? <span className="ml-2 rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-900">Default</span> : null}</p>
            <p>{a.recipient_name} · {a.phone}</p>
            <p>{a.line1}{a.line2 ? `, ${a.line2}` : ""}{a.landmark ? `, ${a.landmark}` : ""}</p>
            <p>{a.city}, {a.state} {a.pincode}</p>
            <form action={deleteAddressAction} className="mt-2">
              <input type="hidden" name="id" value={a.id} />
              <button className="text-red-700 underline">Delete</button>
            </form>
          </li>
        ))}
        {(data ?? []).length === 0 ? <li className="text-sm text-slate-600">No saved addresses yet.</li> : null}
      </ul>
      <h2 className="mb-3 text-lg font-semibold">Add an address</h2>
      <AddressForm next={next || undefined} />
    </>
  );
}

export default function AddressesPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Saved addresses</h1>
      <Suspense fallback={<p className="text-sm">Loading…</p>}>
        <Content searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
