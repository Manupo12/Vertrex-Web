export const ENTITY_TYPES = [
  "client",
  "project",
  "document",
  "resource",
  "finance",
  "agenda",
  "link",
  "repository",
  "ticket",
  "note",
  "idea",
  "legal",
  "social_account",
  "team_member",
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];
