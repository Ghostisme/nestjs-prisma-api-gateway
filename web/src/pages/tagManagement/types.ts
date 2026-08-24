export type { SubTag, TagRecord, TagSaveParams, TagUpdateParams } from "@/api/services/tagService";

export const SCOPE_TYPE_OPTIONS = [
	{ value: 1, label: "Short Video" },
	{ value: 2, label: "Image" },
] as const;

export type ScopeType = (typeof SCOPE_TYPE_OPTIONS)[number]["value"];
