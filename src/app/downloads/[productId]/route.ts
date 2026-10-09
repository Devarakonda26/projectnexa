import { NextResponse, type NextRequest } from "next/server";
import { assertUser, ForbiddenError } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { signedUrlForLatestProductFile } from "@/lib/storage/signed-urls";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Download gate. Order of checks:
 *  1. signed in                                   (assertUser)
 *  2. has_download_access(product) is true        (DB: verified payment, order not cancelled/refunded, caller's own order)
 *  3. only then a short-lived signed URL is minted with the service role and the browser is redirected to it.
 * The file's storage path is never sent to the browser, and the URL expires after DOWNLOAD_URL_TTL_SECONDS.
 */
export async function GET(request: NextRequest, ctx: { params: Promise<{ productId: string }> }) {
  const { productId } = await ctx.params;
  if (!UUID.test(productId)) return new NextResponse("Not found", { status: 404 });

  try {
    await assertUser();
  } catch (e) {
    if (e instanceof ForbiddenError) {
      return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(`/downloads/${productId}`)}`, request.url));
    }
    throw e;
  }

  const supabase = await createClient();
  const { data: allowed } = await supabase.rpc("has_download_access", { p_product_id: productId });
  // 404 (not 403) so the response does not reveal which products have files.
  if (allowed !== true) return new NextResponse("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

  const result = await signedUrlForLatestProductFile(productId);
  if (!result) return new NextResponse("File not available yet. Please contact support.", { status: 404, headers: { "Cache-Control": "no-store" } });

  return NextResponse.redirect(result.url, { status: 302, headers: { "Cache-Control": "no-store" } });
}
