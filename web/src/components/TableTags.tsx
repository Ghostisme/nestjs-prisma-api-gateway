/** 表格内标签展示：复用卖点维护 TagList 组件 */
import { useMemo } from "react";
import { TagList } from "@/pages/directorAIAgent/sellingPointMaintenance/components";
import { cn } from "@/utils";

const MAX_DISPLAY = 3;

export interface TableTagItem {
	id: string | number;
	typeName?: string;
	tagName?: string;
	name?: string;
}

function getDisplayName(tag: TableTagItem): string {
	return tag.typeName ?? tag.tagName ?? tag.name ?? "";
}

export interface TableTagsProps {
	tags: TableTagItem[] | null | undefined;
	className?: string;
}

export function TableTags({ tags, className }: TableTagsProps) {
	const list = useMemo(() => {
		return (tags ?? []).map((tag) => ({ id: tag.id, name: getDisplayName(tag) })).filter((tag) => tag.name);
	}, [tags]);

	if (list.length === 0) {
		return <span className="text-muted-foreground text-xs">-</span>;
	}

	return (
		<div className={cn("flex flex-wrap items-center gap-1.5", className)}>
			<TagList data={list} max={MAX_DISPLAY} />
		</div>
	);
}
