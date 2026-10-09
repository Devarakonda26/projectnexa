/**
 * Turns free text typed in the search box into a safe Postgres tsquery string (config 'simple', prefix matching).
 * Only letters/digits survive, so tsquery operators or PostgREST filter syntax can never be injected.
 * Example: "IoT  weather & (station)" -> "iot:* & weather:* & station:*"
 */
export function toPrefixTsQuery(input: string, maxTerms = 6): string | null {
  const terms = input
    .toLowerCase()
    .normalize("NFKC")
    .split(/[^\p{L}\p{N}\p{M}]+/u)
    .filter((t) => t.length > 0)
    .slice(0, maxTerms)
    .map((t) => t.slice(0, 40));
  if (terms.length === 0) return null;
  return terms.map((t) => `${t}:*`).join(" & ");
}
