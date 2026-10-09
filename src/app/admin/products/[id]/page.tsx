import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ActionForm, inputCls } from "@/components/admin/ActionForm";
import { ProductFileUploader } from "@/components/admin/ProductFileUploader";
import { ProductForm } from "@/components/admin/ProductForm";
import { ProductImage } from "@/components/shop/ProductCard";
import { requireAdmin } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { uploadCoverImageAction } from "../actions";

export const metadata = { title: "Admin · Edit product", robots: { index: false } };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  await requireAdmin(`/admin/products/${id}`);
  const supabase = await createClient();
  const [{ data: product }, { data: branches }, { data: categories }, { data: files }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase.from("branches").select("id, name").order("sort_order"),
    supabase.from("categories").select("id, name, branch_id").order("name"),
    supabase.from("product_files").select("id, file_name, version, size_bytes, created_at").eq("product_id", id).order("version", { ascending: false }),
  ]);
  if (!product) notFound();

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-semibold">{product.title}</h1>
      <ProductForm product={product} branches={branches ?? []} categories={categories ?? []} />

      <section>
        <h2 className="mb-2 text-lg font-semibold">Cover image</h2>
        <ProductImage path={product.cover_image_path} alt="" className="mb-3 aspect-[4/3] w-60 rounded" />
        <ActionForm action={uploadCoverImageAction} submitLabel="Upload image">
          <input type="hidden" name="productId" value={id} />
          <input type="file" name="image" accept="image/png,image/jpeg,image/webp" className={inputCls} />
          <p className="text-xs text-slate-600">PNG, JPG or WebP, up to 2 MB. Shown publicly.</p>
        </ActionForm>
      </section>

      {product.product_type === "digital" ? (
        <section>
          <h2 className="mb-2 text-lg font-semibold">Downloadable files (private)</h2>
          <ul className="mb-4 space-y-1 text-sm">
            {(files ?? []).map((f) => <li key={f.id}>v{f.version} · {f.file_name} · {(Number(f.size_bytes) / 1048576).toFixed(1)} MB</li>)}
            {(files ?? []).length === 0 ? <li className="text-slate-600">No file uploaded yet. Customers cannot download anything until you add one.</li> : null}
          </ul>
          <ProductFileUploader productId={id} />
        </section>
      ) : null}
    </div>
  );
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main>
      <Suspense fallback={<p className="text-sm">Loading…</p>}><Content params={params} /></Suspense>
    </main>
  );
}
