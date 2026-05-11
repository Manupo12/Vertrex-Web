"use client";
import { searchEntitiesAction } from "@/lib/db/actions/search";

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function getMentionMenuItems(editor: any) {
  return async (query: string) => {
    if (!query || query.length < 1) return [];

    const results = await new Promise<Awaited<ReturnType<typeof searchEntitiesAction>>>((resolve) => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        const res = await searchEntitiesAction(query);
        resolve(res);
      }, 300);
    });

    return results.slice(0, 8).map((r) => ({
      id: r.id,
      label: r.label,
      subtitle: r.subtitle,
      type: r.type,
      onItemClick: () => {
        editor.insertInlineContent([
          { type: "mention", props: { id: r.id, type: r.type, label: r.label } },
        ]);
      },
    }));
  };
}
