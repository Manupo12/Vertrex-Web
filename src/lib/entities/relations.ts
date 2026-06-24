export type RelationType = "relates_to" | "blocks" | "blocked_by" | "mentions" | "mentioned_by";

export type RelationDef = {
  type: RelationType;
  label: string;
  inverse: RelationType;
  symmetric: boolean;
};

export const RELATION_REGISTRY: Record<RelationType, RelationDef> = {
  relates_to: {
    type: "relates_to",
    label: "Relacionado con",
    inverse: "relates_to",
    symmetric: true,
  },
  blocks: {
    type: "blocks",
    label: "Bloquea a",
    inverse: "blocked_by",
    symmetric: false,
  },
  blocked_by: {
    type: "blocked_by",
    label: "Bloqueado por",
    inverse: "blocks",
    symmetric: false,
  },
  mentions: {
    type: "mentions",
    label: "Menciona a",
    inverse: "mentioned_by",
    symmetric: false,
  },
  mentioned_by: {
    type: "mentioned_by",
    label: "Mencionado en",
    inverse: "mentions",
    symmetric: false,
  },
};

export function inverseOf(t: RelationType): RelationType {
  const def = RELATION_REGISTRY[t];
  return def ? def.inverse : t;
}
