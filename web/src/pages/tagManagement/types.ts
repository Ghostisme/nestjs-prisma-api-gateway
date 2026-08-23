export type { SubTag, TagRecord, TagSaveParams, TagUpdateParams } from "@/api/services/tagService";

export const SCOPE_TYPE_OPTIONS = [
	{ value: 1, label: "短视频" },
	{ value: 2, label: "图片" },
] as const;

export type ScopeType = (typeof SCOPE_TYPE_OPTIONS)[number]["value"];
