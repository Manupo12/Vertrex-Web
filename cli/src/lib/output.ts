import { stringify as toYaml } from "yaml";

export type Fmt = "table" | "json" | "yaml" | "csv";

export function format(data: unknown, fmt: Fmt): string {
  if (fmt === "json") return JSON.stringify(data, null, 2);
  if (fmt === "yaml") return toYaml(data as any);
  const rows = Array.isArray(data) ? data : [data];
  if (rows.length === 0) return "(sin resultados)";
  const cols = Array.from(new Set(rows.flatMap((r) => Object.keys(r ?? {}))));
  if (fmt === "csv") {
    return [
      cols.join(","),
      ...rows.map((r: any) => cols.map((c) => csv(r?.[c])).join(",")),
    ].join("\n");
  }
  const w = cols.map(
    (c) => Math.max(c.length, ...rows.map((r: any) => String(r?.[c] ?? "").length)),
  );
  const line = (cells: string[]) => cells.map((s, i) => s.padEnd(w[i])).join("  ");
  return [
    line(cols),
    line(w.map((n) => "-".repeat(n))),
    ...rows.map((r: any) => line(cols.map((c) => String(r?.[c] ?? "")))),
  ].join("\n");
}

function csv(v: unknown) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
