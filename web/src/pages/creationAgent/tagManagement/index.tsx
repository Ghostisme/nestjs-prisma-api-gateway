import { useQuery, useQueryClient } from "@tanstack/react-query";
import { App, Button, Card, Empty, Popconfirm, Select, Space, Spin, Tag } from "antd";
import dayjs from "dayjs";
import { useCallback, useState } from "react";
import { tagService, type TagRecord } from "@/api/creationAgent";
import { AuthGuard } from "@/components/auth/auth-guard";
import TagFormModal from "./components/TagFormModal";
import { SCOPE_TYPE_OPTIONS } from "./types";

const TAG_LIST_QUERY_KEY = "tag-list";

export default function TagManagementPage() {
	const { message } = App.useApp();
	const queryClient = useQueryClient();

	const [scopeType, setScopeType] = useState<number>(1);
	const [formOpen, setFormOpen] = useState(false);
	const [editingTag, setEditingTag] = useState<TagRecord | null>(null);

	const { data, isLoading } = useQuery({
		queryKey: [TAG_LIST_QUERY_KEY, scopeType],
		queryFn: () => tagService.getTagList({ scopeType }),
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		refetchOnMount: false,
		staleTime: Infinity,
	});

	const tagList = data?.list ?? [];

	const refreshList = useCallback(() => {
		queryClient.invalidateQueries({ queryKey: [TAG_LIST_QUERY_KEY] });
	}, [queryClient]);

	const openCreate = useCallback(() => {
		setEditingTag(null);
		setFormOpen(true);
	}, []);

	const openEdit = useCallback((record: TagRecord) => {
		setEditingTag(record);
		setFormOpen(true);
	}, []);

	const handleDelete = useCallback(
		async (record: TagRecord) => {
			try {
				await tagService.deleteTag(record.id);
				message.success("删除成功");
				refreshList();
			} catch (error) {
				// message.error("删除失败");
				message.error(error.message);
			}
		},
		[message, refreshList],
	);

	const handleFormSuccess = useCallback(() => {
		setFormOpen(false);
		refreshList();
	}, [refreshList]);

	const scopeLabel = (type: number) => SCOPE_TYPE_OPTIONS.find((opt) => opt.value === type)?.label ?? "未知";

	// const collapseItems = tagList.map((item) => ({
	// 	key: String(item.id),
	// 	label: (
	// 		<div className="flex items-center justify-between w-full pr-2">
	// 			<Space size="large">
	// 				<span className="font-semibold text-sm">{item.name}</span>
	// 				<span className="text-xs text-gray-500">应用范围：{scopeLabel(item.scopeType)}</span>
	// 				<span className="text-xs text-gray-500">
	// 					创建时间：{dayjs(item.createTime).format("YYYY-MM-DD HH:mm:ss")}
	// 				</span>
	// 				<span className="text-xs text-gray-500">创建人：{item.createdUserName || "未知"}</span>
	// 			</Space>
	// 			<Space size={4} onClick={(e) => e.stopPropagation()}>
	// 				<Button type="link" size="small" onClick={() => openEdit(item)}>
	// 					编辑
	// 				</Button>
	// 				<Popconfirm title="确认删除该标签吗？" onConfirm={() => handleDelete(item)}>
	// 					<Button type="link" size="small" danger>
	// 						删除
	// 					</Button>
	// 				</Popconfirm>
	// 			</Space>
	// 		</div>
	// 	),
	// 	children: (
	// 		<div className="flex flex-wrap gap-2">
	// 			{item.subTags?.length ? (
	// 				item.subTags.map((sub) => (
	// 					<Tag key={sub.id} color="#108ee9">
	// 						{sub.name}
	// 					</Tag>
	// 				))
	// 			) : (
	// 				<span className="text-xs text-gray-400">暂无子标签</span>
	// 			)}
	// 		</div>
	// 	),
	// }));

	return (
		<div className="h-full flex flex-col overflow-hidden rounded-lg bg-white">
			{/* 固定顶部操作栏 */}
			<div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
				<Space>
					<span className="text-sm text-gray-600">应用范围</span>
					<Select
						value={scopeType}
						onChange={setScopeType}
						options={[...SCOPE_TYPE_OPTIONS]}
						style={{ width: 160 }}
						disabled={isLoading}
					/>
				</Space>
				<AuthGuard>
					<Button type="primary" onClick={openCreate}>
						新建标签
					</Button>
				</AuthGuard>
			</div>

			{/* 可滚动标签列表区域 */}
			<div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
				<Spin spinning={isLoading}>
					{tagList.length === 0 && !isLoading ? (
						<Empty description="暂无标签数据" />
					) : (
						<div className="flex flex-col gap-4">
							{tagList.map((item) => (
								<Card
									key={item.id}
									// variant="borderless"
									styles={{
										root: {
											border: "none",
										},
										header: {
											background: "#F8FAFF",
											borderBottom: "none",
										},
									}}
									title={
										<Space size="large">
											<span className="font-semibold text-sm text-[#1D2129]">{item.name}</span>
											<span className="text-xs text-gray-500 font-normal!">应用范围：{scopeLabel(item.scopeType)}</span>
											<span className="text-xs text-gray-500 font-normal!">
												创建时间：
												{dayjs(item.createTime).format("YYYY-MM-DD HH:mm:ss")}
											</span>
											<span className="text-xs text-gray-500 font-normal!">
												创建人：{item.createUserName || "未知"}
											</span>
										</Space>
									}
									extra={
										<Space size={4}>
											<AuthGuard>
												<Button type="link" size="small" onClick={() => openEdit(item)}>
													<span className="text-sm">编辑</span>
												</Button>
											</AuthGuard>
											<AuthGuard>
												<Popconfirm title="确认删除该标签吗？" onConfirm={() => handleDelete(item)}>
													<Button type="link" size="small" danger>
														<span className="text-sm">删除</span>
													</Button>
												</Popconfirm>
											</AuthGuard>
										</Space>
									}
									size="small"
								>
									<div className="flex flex-wrap gap-2">
										{item.subTags?.length ? (
											item.subTags.map((sub) => (
												<Tag
													key={sub.id}
													color="#4E5969"
													className="font-normal! bg-[#F5F5F5]! text-sm! m-0! px-2! py-1!"
												>
													{sub.name}
												</Tag>
											))
										) : (
											<span className="text-xs text-gray-400">暂无子标签</span>
										)}
									</div>
								</Card>
							))}
						</div>
					)}
				</Spin>
			</div>

			{/* 新建/编辑弹窗 */}
			<TagFormModal open={formOpen} onOpenChange={setFormOpen} initialData={editingTag} onSuccess={handleFormSuccess} />
		</div>
	);
}
