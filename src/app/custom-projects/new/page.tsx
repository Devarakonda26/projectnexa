import { Suspense } from "react";
import { CustomRequestForm } from "@/components/shop/CustomRequestForm";
import { requireUser } from "@/lib/auth/dal";
import { listBranches } from "@/lib/catalogue/queries";

export const metadata = { title: "New custom project request" };

async function Form() {
  await requireUser("/custom-projects/new");
  const branches = await listBranches();
  return <CustomRequestForm branches={branches.map((b) => ({ id: b.id, name: b.name }))} />;
}

export default function NewRequestPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Request a custom project</h1>
      <Suspense fallback={<p className="text-sm">Loading…</p>}>
        <Form />
      </Suspense>
    </main>
  );
}
