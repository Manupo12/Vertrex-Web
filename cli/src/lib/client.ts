import { getProfile, defaultApiUrl } from "./config.js";

export class CliError extends Error {
  constructor(message: string, public exitCode = 1) {
    super(message);
  }
}

export async function api<T = unknown>(
  method: string,
  path: string,
  opts: { body?: unknown; profile?: string; apiUrl?: string; token?: string } = {},
): Promise<T> {
  const prof = getProfile(opts.profile);
  const apiUrl = opts.apiUrl || prof?.apiUrl || defaultApiUrl;
  const token = opts.token ?? prof?.token;
  const res = await fetch(`${apiUrl}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    const code = json?.error?.code;
    const msg = json?.error?.message || res.statusText;
    const exit =
      res.status === 401 || res.status === 403
        ? 77 /*EX_NOPERM*/
        : res.status === 404
          ? 69 /*EX_UNAVAILABLE*/
          : res.status >= 500
            ? 70 /*EX_SOFTWARE*/
            : 65 /*EX_DATAERR*/;
    throw new CliError(`${code ? `[${code}] ` : ""}${msg}`, exit);
  }
  return json.data as T;
}
