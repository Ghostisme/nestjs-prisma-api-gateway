import { useQuery } from "@tanstack/react-query";
import { Button, Input, Pagination, Select, Spin, message } from "antd";
import { type JSX, useCallback, useState } from "react";
import { Icon } from "@/components/icon";
import aiKnowledgeBaseService from "@/api/services/aiKnowledgeBaseService";
import { getApiErrorMessage } from "@/utils/request-error";
import KnowledgeBaseCard from "./components/KnowledgeBaseCard";
import KnowledgeBaseDetailPage from "./components/KnowledgeBaseDetailPage";
import KnowledgeBaseFormPage from "./components/KnowledgeBaseFormPage";

const PAGE_SIZE = 8;

const STATUS_OPTIONS = [
	{ label: "All", value: "" },
	{ label: "Enabled", value: "active" },
	{ label: "Disabled", value: "disabled" },
];

export default function KnowledgeBasePage(): JSX.Element {
	const [currentPage, setCurrentPage] = useState(1);
	const [searchName, setSearchName] = useState("");
	const [searchTag, setSearchTag] = useState("");
	const [statusFilter, setStatusFilter] = useState("");
	const [refreshKey, setRefreshKey] = useState(0);

	const [viewMode, setViewMode] = useState<"list" | "create" | "edit" | "view">("list");
	const [editId, setEditId] = useState<string | null>(null);

	const { data, isPending } = useQuery({
		queryKey: ["knowledge-base-list", currentPage, searchName, searchTag, statusFilter, refreshKey],
		queryFn: () =>
			aiKnowledgeBaseService.getKnowledgeBaseList({
				current: currentPage,
				size: PAGE_SIZE,
				name: searchName,
				tag: searchTag,
				status: statusFilter,
			}),
	});

	const overview = data?.overview;
	const items = data?.items ?? [];

	const handleSearch = useCallback(() => {
		setCurrentPage(1);
		setRefreshKey((k) => k + 1);
	}, []);

	const handleReset = useCallback(() => {
		setSearchName("");
		setSearchTag("");
		setStatusFilter("");
		setCurrentPage(1);
		setRefreshKey((k) => k + 1);
	}, []);

	const handleEdit = useCallback((id: string) => {
		setEditId(id);
		setViewMode("edit");
	}, []);

	const handleView = useCallback((id: string) => {
		setEditId(id);
		setViewMode("view");
	}, []);

	const handleToggleStatus = useCallback(async (id: string, status: "active" | "disabled") => {
		try {
			await aiKnowledgeBaseService.toggleKnowledgeBaseStatus(id, status);
			message.success(status === "active" ? "Enabled successfully" : "Disabled successfully");
			setRefreshKey((k) => k + 1);
		} catch (error) {
			message.error(getApiErrorMessage(error, "Operation failed"));
		}
	}, []);

	const handleFormBack = useCallback(() => {
		setViewMode("list");
		setEditId(null);
	}, []);

	const handleFormSuccess = useCallback(() => {
		setViewMode("list");
		setEditId(null);
		setRefreshKey((k) => k + 1);
	}, []);

	if (viewMode === "view" && editId) {
		return <KnowledgeBaseDetailPage knowledgeBaseId={editId} onBack={handleFormBack} onEdit={handleEdit} />;
	}

	if (viewMode === "create" || viewMode === "edit") {
		return (
			<KnowledgeBaseFormPage
				knowledgeBaseId={viewMode === "edit" ? editId : null}
				onBack={handleFormBack}
				onSuccess={handleFormSuccess}
			/>
		);
	}

	return (
		<div className="space-y-6">
			{/* Stat Cards */}
			<div className="grid grid-cols-3 gap-6">
				<div className="rounded-xl bg-[var(--card)] p-6 shadow-sm border border-[var(--border)] flex items-center gap-4">
					<div className="flex-1">
						<div className="text-sm text-[var(--muted-foreground)] mb-1">Knowledge bases</div>
						<div className="text-3xl font-bold text-[var(--foreground)]">{overview?.totalBases ?? "-"}</div>
					</div>
					<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
						<Icon icon="ph:database" size={26} className="text-primary" />
					</div>
				</div>
				<div className="rounded-xl bg-[var(--card)] p-6 shadow-sm border border-[var(--border)] flex items-center gap-4">
					<div className="flex-1">
						<div className="text-sm text-[var(--muted-foreground)] mb-1">Documents</div>
						<div className="text-3xl font-bold text-[var(--foreground)]">{overview?.totalDocuments ?? "-"}</div>
					</div>
					<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
						<Icon icon="ph:file-text" size={26} className="text-blue-500" />
					</div>
				</div>
				<div className="rounded-xl bg-[var(--card)] p-6 shadow-sm border border-[var(--border)] flex items-center gap-4">
					<div className="flex-1">
						<div className="text-sm text-[var(--muted-foreground)] mb-1">Total references</div>
						<div className="text-3xl font-bold text-[var(--foreground)]">{overview?.totalReferences ?? "-"}</div>
					</div>
					<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10">
						<Icon icon="ph:quotes" size={26} className="text-violet-500" />
					</div>
				</div>
			</div>

			{/* Search Filters */}
			<div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
				<div className="flex items-center gap-3 flex-wrap">
					<Input
						placeholder="Search knowledge bases..."
						value={searchName}
						onChange={(e) => setSearchName(e.target.value)}
						className="w-64"
						allowClear
					/>
					<div className="flex items-center gap-2">
						<span className="text-sm text-[var(--muted-foreground)]">Tag</span>
						<Input
							placeholder="Enter tag"
							value={searchTag}
							onChange={(e) => setSearchTag(e.target.value)}
							className="w-32"
							allowClear
						/>
					</div>
					<div className="flex items-center gap-2">
						<span className="text-sm text-[var(--muted-foreground)]">Status</span>
						<Select value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} className="w-28" />
					</div>
					<div className="flex gap-2 ml-auto">
						<Button type="primary" onClick={handleSearch}>
							Search
						</Button>
						<Button onClick={handleReset}>Reset</Button>
					</div>
				</div>
			</div>

			{/* Card Grid */}
			{isPending ? (
				<div className="flex items-center justify-center min-h-[300px]">
					<Spin size="large" />
				</div>
			) : (
				<>
					<div className="grid grid-cols-3 gap-6">
						{items.map((item) => (
							<KnowledgeBaseCard
								key={item.id}
								item={item}
								onEdit={handleEdit}
								onView={handleView}
								onToggleStatus={handleToggleStatus}
							/>
						))}

						{/* Create New Card */}
						<div
							className="rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--card)] flex flex-col items-center justify-center min-h-[220px] cursor-pointer transition-all hover:border-primary hover:shadow-md"
							onClick={() => setViewMode("create")}
						>
							<div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-3">
								<Icon icon="ph:plus" size={28} className="text-primary" />
							</div>
							<span className="text-sm font-medium text-primary">Create knowledge base</span>
						</div>
					</div>

					{/* Pagination */}
					{(data?.total ?? 0) > PAGE_SIZE && (
						<div className="flex justify-end">
							<Pagination
								current={currentPage}
								total={data?.total ?? 0}
								pageSize={PAGE_SIZE}
								onChange={setCurrentPage}
								showQuickJumper={false}
								showSizeChanger={false}
							/>
						</div>
					)}
				</>
			)}
		</div>
	);
}
