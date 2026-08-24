import { useQuery } from "@tanstack/react-query";
import { Button, Spin, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { type JSX, useMemo } from "react";
import { Icon } from "@/components/icon";
import aiKnowledgeBaseService from "@/api/services/aiKnowledgeBaseService";
import type { KnowledgeBaseDocument } from "../types";

interface KnowledgeBaseDetailPageProps {
	knowledgeBaseId: string;
	onBack: () => void;
	onEdit: (id: string) => void;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
	active: { label: "Enabled", color: "green" },
	disabled: { label: "Disabled", color: "red" },
};

const DOC_STATUS_MAP: Record<string, { label: string; color: string }> = {
	processing: { label: "Processing", color: "blue" },
	completed: { label: "Completed", color: "green" },
	failed: { label: "Failed", color: "red" },
};

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function KnowledgeBaseDetailPage({
	knowledgeBaseId,
	onBack,
	onEdit,
}: KnowledgeBaseDetailPageProps): JSX.Element {
	const { data: detail, isPending } = useQuery({
		queryKey: ["knowledge-base-detail", knowledgeBaseId],
		queryFn: () => aiKnowledgeBaseService.getKnowledgeBaseDetail(knowledgeBaseId),
	});

	const docColumns = useMemo<ColumnsType<KnowledgeBaseDocument>>(
		() => [
			{ title: "File name", dataIndex: "fileName", key: "fileName" },
			{
				title: "Size",
				dataIndex: "fileSize",
				key: "fileSize",
				render: (v: number) => formatFileSize(v),
			},
			{ title: "Type", dataIndex: "fileType", key: "fileType" },
			{ title: "Uploaded", dataIndex: "uploadTime", key: "uploadTime" },
			{
				title: "Status",
				dataIndex: "status",
				key: "status",
				render: (status: string) => {
					const s = DOC_STATUS_MAP[status] ?? {
						label: status,
						color: "default",
					};
					return <Tag color={s.color}>{s.label}</Tag>;
				},
			},
		],
		[],
	);

	if (isPending) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Spin size="large" />
			</div>
		);
	}

	if (!detail) {
		return <div className="text-center py-20 text-[var(--muted-foreground)]">Knowledge base not found or deleted</div>;
	}

	const statusInfo = STATUS_MAP[detail.status] ?? {
		label: detail.status,
		color: "default",
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-3">
					<Button
						type="text"
						icon={<Icon icon="ph:arrow-left" size={18} />}
						onClick={onBack}
						className="flex items-center"
					>
						Back
					</Button>
					<h2 className="text-lg font-semibold m-0">Knowledge base detail</h2>
				</div>
				<Button type="primary" onClick={() => onEdit(knowledgeBaseId)}>
					Edit
				</Button>
			</div>

			<div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8">
				<h3 className="text-base font-semibold flex items-center gap-2 mb-6">
					<span className="inline-block w-1 h-4 rounded bg-primary" />
					Basic info
				</h3>

				<div className="grid grid-cols-2 gap-y-5 gap-x-10 max-w-3xl">
					<div>
						<div className="text-sm text-[var(--muted-foreground)] mb-1">Name</div>
						<div className="text-base font-medium text-[var(--foreground)]">{detail.name}</div>
					</div>
					<div>
						<div className="text-sm text-[var(--muted-foreground)] mb-1">Status</div>
						<Tag color={statusInfo.color}>{statusInfo.label}</Tag>
					</div>
					<div className="col-span-2">
						<div className="text-sm text-[var(--muted-foreground)] mb-1">Description</div>
						<div className="text-sm text-[var(--foreground)] whitespace-pre-wrap">{detail.description || "-"}</div>
					</div>
					<div>
						<div className="text-sm text-[var(--muted-foreground)] mb-1">Tags</div>
						<div className="flex gap-1 flex-wrap">
							{detail.tags.length > 0 ? (
								detail.tags.map((tag) => (
									<Tag key={tag.tagId} color="blue">
										{tag.tagName}
									</Tag>
								))
							) : (
								<span className="text-sm text-[var(--muted-foreground)]">-</span>
							)}
						</div>
					</div>
					<div>
						<div className="text-sm text-[var(--muted-foreground)] mb-1">References</div>
						<div className="text-base font-medium text-[var(--foreground)]">{detail.referenceCount}</div>
					</div>
					<div>
						<div className="text-sm text-[var(--muted-foreground)] mb-1">Created</div>
						<div className="text-sm text-[var(--foreground)]">{detail.createdAt}</div>
					</div>
					<div>
						<div className="text-sm text-[var(--muted-foreground)] mb-1">Updated</div>
						<div className="text-sm text-[var(--foreground)]">{detail.updatedAt}</div>
					</div>
				</div>
			</div>

			<div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8">
				<h3 className="text-base font-semibold flex items-center gap-2 mb-6">
					<span className="inline-block w-1 h-4 rounded bg-primary" />
					Documents
					<span className="text-sm font-normal text-[var(--muted-foreground)]">
						({detail.documents?.length ?? 0} files)
					</span>
				</h3>

				<Table<KnowledgeBaseDocument>
					columns={docColumns}
					dataSource={detail.documents ?? []}
					rowKey="docId"
					pagination={false}
					bordered
					size="middle"
					locale={{ emptyText: "No documents" }}
				/>
			</div>
		</div>
	);
}
