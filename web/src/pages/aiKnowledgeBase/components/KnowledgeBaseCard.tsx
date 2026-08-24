import { Button, Popconfirm, Tag } from "antd";
import type { KnowledgeBaseItem } from "../types";
import type { JSX } from "react";

interface KnowledgeBaseCardProps {
	item: KnowledgeBaseItem;
	onEdit: (id: string) => void;
	onView: (id: string) => void;
	onToggleStatus: (id: string, status: "active" | "disabled") => void;
}

export default function KnowledgeBaseCard({
	item,
	onEdit,
	onView,
	onToggleStatus,
}: KnowledgeBaseCardProps): JSX.Element {
	const isActive = item.status === "active";

	return (
		<div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition-all hover:shadow-lg flex flex-col justify-between min-h-[220px]">
			<div>
				<div className="flex items-start justify-between mb-3">
					<h3 className="text-base font-semibold text-[var(--foreground)] truncate pr-2">{item.name}</h3>
					<div className="flex gap-1 flex-shrink-0">
						{item.tags.map((tag) => (
							<Tag key={tag.tagId} color="blue" className="text-xs">
								{tag.tagName}
							</Tag>
						))}
					</div>
				</div>

				<div className="grid grid-cols-2 gap-4 mb-4">
					<div className="text-center py-3 rounded-lg bg-[var(--muted)]/50">
						<div className="text-xl font-bold text-[var(--foreground)]">{item.documentCount}</div>
						<div className="text-xs text-[var(--muted-foreground)] mt-1">Documents</div>
					</div>
					<div className="text-center py-3 rounded-lg bg-[var(--muted)]/50">
						<div className="text-xl font-bold text-[var(--foreground)]">{item.referenceCount}</div>
						<div className="text-xs text-[var(--muted-foreground)] mt-1">References</div>
					</div>
				</div>

				<p className="text-sm text-[var(--muted-foreground)] mb-3 line-clamp-2">{item.description}</p>
			</div>

			<div>
				<div className="text-xs text-[var(--muted-foreground)] mb-3">Updated {item.updatedAt}</div>
				<div className="flex gap-3 border-t border-[var(--border)] pt-3">
					<Button type="link" className="p-0 text-sm" onClick={() => onEdit(item.id)}>
						Edit
					</Button>
					<Button type="link" className="p-0 text-sm" onClick={() => onView(item.id)}>
						View
					</Button>
					<Popconfirm
						title={isActive ? "Disable this knowledge base?" : "Enable this knowledge base?"}
						onConfirm={() => onToggleStatus(item.id, isActive ? "disabled" : "active")}
					>
						<Button type="link" className="p-0 text-sm" danger={isActive}>
							{isActive ? "Disable" : "Enable"}
						</Button>
					</Popconfirm>
				</div>
			</div>
		</div>
	);
}
