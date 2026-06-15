export function jsonToFormData(obj: Record<string, unknown>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    fd.set(k, typeof v === "object" ? JSON.stringify(v) : String(v));
  }
  return fd;
}
