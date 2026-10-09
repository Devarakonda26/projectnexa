import { saveProductAction } from "@/app/admin/products/actions";
import { formatINR } from "@/lib/money";
import { ActionForm, inputCls } from "./ActionForm";

type Option = { id: string; name: string; branch_id?: string };
type Product = {
  id?: string; title?: string; slug?: string; summary?: string; description?: string; product_type?: "digital" | "hardware"; status?: string;
  branch_id?: string; category_id?: string | null; price_paise?: number; mrp_paise?: number | null; difficulty?: string | null;
  tech_stack?: string[]; tags?: string[]; weight_grams?: number | null; cod_eligible?: boolean; is_featured?: boolean;
  is_sample?: boolean; is_quote_only?: boolean; sku?: string | null; subdomain?: string | null; estimated_time?: string | null;
  features?: string[]; deliverables?: string[]; software_requirements?: string[]; hardware_requirements?: string[]; faq?: { q: string; a: string }[];
};

const rupeesText = (p?: number | null) => (p === undefined || p === null ? "" : (p / 100).toFixed(2).replace(/\.00$/, ""));

export function ProductForm({ product, branches, categories }: { product?: Product; branches: Option[]; categories: Option[] }) {
  const isNew = !product?.id;
  const label = (htmlFor: string, text: string) => <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium">{text}</label>;
  return (
    <ActionForm action={saveProductAction} submitLabel={isNew ? "Create product" : "Save changes"} className="grid gap-4 sm:grid-cols-2">
      {product?.id ? <input type="hidden" name="id" value={product.id} /> : null}
      <div className="sm:col-span-2">{label("title", "Title")}<input id="title" name="title" required defaultValue={product?.title} className={inputCls} /></div>
      <div>{label("slug", "URL slug")}<input id="slug" name="slug" required defaultValue={product?.slug} pattern="[a-z0-9]+(-[a-z0-9]+)*" className={inputCls} /></div>
      <div>
        {label("productType", "Type")}
        <select id="productType" name="productType" required defaultValue={product?.product_type ?? "digital"} disabled={!isNew} className={inputCls}>
          <option value="digital">Digital project</option>
          <option value="hardware">Hardware kit</option>
        </select>
        {!isNew ? <input type="hidden" name="productType" value={product?.product_type} /> : null}
      </div>
      <div className="sm:col-span-2">{label("summary", "Summary (10-300 characters)")}<input id="summary" name="summary" required maxLength={300} defaultValue={product?.summary} className={inputCls} /></div>
      <div className="sm:col-span-2">{label("description", "Description (plain text)")}<textarea id="description" name="description" rows={8} defaultValue={product?.description} className={inputCls} /></div>
      <div>
        {label("branchId", "Branch")}
        <select id="branchId" name="branchId" required defaultValue={product?.branch_id ?? ""} className={inputCls}>
          <option value="" disabled>Select</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>
      <div>
        {label("categoryId", "Category (optional)")}
        <select id="categoryId" name="categoryId" defaultValue={product?.category_id ?? ""} className={inputCls}>
          <option value="">None</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>{label("price", "Price (₹)")}<input id="price" name="price" required inputMode="decimal" defaultValue={rupeesText(product?.price_paise)} className={inputCls} />{product?.price_paise ? <p className="mt-1 text-xs text-slate-600">{formatINR(product.price_paise)}</p> : null}</div>
      <div>{label("mrp", "MRP (₹, optional)")}<input id="mrp" name="mrp" inputMode="decimal" defaultValue={rupeesText(product?.mrp_paise)} className={inputCls} /></div>
      <div>
        {label("difficulty", "Difficulty")}
        <select id="difficulty" name="difficulty" defaultValue={product?.difficulty ?? ""} className={inputCls}>
          <option value="">Not set</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
        </select>
      </div>
      <div>
        {label("status", "Status")}
        <select id="status" name="status" defaultValue={product?.status ?? "draft"} className={inputCls}>
          <option value="draft">Draft (hidden)</option><option value="published">Published</option><option value="archived">Archived (hidden)</option>
        </select>
      </div>
      <div>{label("techStack", "Tech stack (comma separated)")}<input id="techStack" name="techStack" defaultValue={product?.tech_stack?.join(", ")} className={inputCls} /></div>
      <div>{label("tags", "Search tags (comma separated)")}<input id="tags" name="tags" defaultValue={product?.tags?.join(", ")} className={inputCls} /></div>
      <div>{label("weightGrams", "Weight in grams (hardware)")}<input id="weightGrams" name="weightGrams" inputMode="numeric" defaultValue={product?.weight_grams ?? ""} className={inputCls} /></div>
      {isNew ? (
        <>
          <div>{label("initialStock", "Opening stock (hardware)")}<input id="initialStock" name="initialStock" inputMode="numeric" defaultValue="0" className={inputCls} /></div>
          <div>{label("lowStockThreshold", "Low-stock alert at")}<input id="lowStockThreshold" name="lowStockThreshold" inputMode="numeric" defaultValue="5" className={inputCls} /></div>
        </>
      ) : null}
      <div>{label("sku", "Project ID / SKU (optional)")}<input id="sku" name="sku" defaultValue={product?.sku ?? ""} placeholder="PN-CSE-001" className={inputCls} /></div>
      <div>{label("subdomain", "Sub-domain (optional)")}<input id="subdomain" name="subdomain" maxLength={80} defaultValue={product?.subdomain ?? ""} className={inputCls} /></div>
      <div>{label("estimatedTime", "Estimated build/delivery time (optional)")}<input id="estimatedTime" name="estimatedTime" maxLength={60} defaultValue={product?.estimated_time ?? ""} className={inputCls} /></div>
      <div className="sm:col-span-2">{label("features", "Key features (one per line)")}<textarea id="features" name="features" rows={4} defaultValue={product?.features?.join("\n")} className={inputCls} /></div>
      <div className="sm:col-span-2">{label("deliverables", "What is included (one per line)")}<textarea id="deliverables" name="deliverables" rows={4} defaultValue={product?.deliverables?.join("\n")} className={inputCls} /></div>
      <div>{label("softwareRequirements", "Software requirements (one per line)")}<textarea id="softwareRequirements" name="softwareRequirements" rows={3} defaultValue={product?.software_requirements?.join("\n")} className={inputCls} /></div>
      <div>{label("hardwareRequirements", "Hardware requirements (one per line)")}<textarea id="hardwareRequirements" name="hardwareRequirements" rows={3} defaultValue={product?.hardware_requirements?.join("\n")} className={inputCls} /></div>
      <div className="sm:col-span-2">{label("faq", "FAQ (one per line, written as: Question | Answer)")}<textarea id="faq" name="faq" rows={4} defaultValue={product?.faq?.map((f) => `${f.q} | ${f.a}`).join("\n")} className={inputCls} /></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isSample" defaultChecked={product?.is_sample} /> Sample / demo listing (shows a “Sample” badge)</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isQuoteOnly" defaultChecked={product?.is_quote_only} /> Custom project: “Request a quote” instead of Add to cart (digital type only)</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="codEligible" defaultChecked={product?.cod_eligible} /> Cash on delivery allowed (hardware only)</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isFeatured" defaultChecked={product?.is_featured} /> Show on homepage as featured</label>
    </ActionForm>
  );
}
