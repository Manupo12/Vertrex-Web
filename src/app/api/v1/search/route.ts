import { authed } from "@/lib/api/handler";
import { searchEntitiesAction } from "@/lib/db/actions/search";
import { ApiError } from "@/lib/api/errors";

export const runtime = "nodejs";

export const GET = authed(async ({ req }) => {
  const q = new URL(req.url).searchParams.get("q");
  if (!q) throw new ApiError("bad_request", 400, "parámetro q requerido");
  const limit = Number(new URL(req.url).searchParams.get("limit") || 25);
  const all = await searchEntitiesAction(q);
  return all.slice(0, limit);
});
