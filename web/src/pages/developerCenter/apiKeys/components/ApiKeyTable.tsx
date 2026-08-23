import { App, Button, Popconfirm, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { type JSX, useCallback, useMemo } from "react";
import type { ApiKeyItem } from "../../types";

const STATUS_TAG_MAP: Record<string, { color: string; label: string }> = {
	active: { color: "green", label: "启用" },
	revoked: { color: "red", label: "已撤销" },
	expired: { color: "default", label: "已过期" },
};

interface ApiKeyTableProps {
	dataSource: ApiKeyItem[];
	loading?: boolean;
	onRevoke: (id: number) => void;
	onDelete: (id: number) => void;
}

export const ApiKeyTable = ({ dataSource, loading, onRevoke, onDelete }: ApiKeyTableProps): JSX.Element => {
	const { message } = App.useApp();

	const handleCopyPrefix = useCallback(
		(prefix: string) => {
			navigator.clipboard.writeText(prefix);
			message.success("已复制");
		},
		[message],
	);

	const columns = useMemo<ColumnsType<ApiKeyItem>>(
		() => [
			{ title: "名称", dataIndex: "name", width: 160, ellipsis: true },
			{
				title: "Key 前缀",
				dataIndex: "keyPrefix",
				width: 180,
				render: (prefix: string) => (
					<Button type="link" className="p-0 font-mono" onClick={() => handleCopyPrefix(prefix)}>
						{prefix}***
					</Button>
				),
			},
			{
				title: "权限范围",
				dataIndex: "scopes",
				width: 200,
				render: (scopes: string[]) => (
					<Space size={4} wrap>
						{scopes.map((s) => (
							<Tag key={s}>{s}</Tag>
						))}
					</Space>
				),
			},
			{
				title: "状态",
				dataIndex: "status",
				width: 100,
				align: "center",
				render: (status: string) => {
					const cfg = STATUS_TAG_MAP[status] ?? { color: "default", label: status };
					return <Tag color={cfg.color}>{cfg.label}</Tag>;
				},
			},
			{
				title: "最后使用",
				dataIndex: "lastUsedAt",
				width: 180,
				render: (v: string | null) => v ?? "—",
			},
			{ title: "创建时间", dataIndex: "createdAt", width: 180 },
			{
				title: "操作",
				width: 160,
				fixed: "right",
				align: "center",
				render: (_: unknown, record: ApiKeyItem) => (
					<Space>
						{record.status === "active" && (
							<Popconfirm title="确认撤销该 Key？撤销后不可恢复。" onConfirm={() => onRevoke(record.id)}>
								<Button type="link" className="p-0" danger>
									撤销
								</Button>
							</Popconfirm>
						)}
						<Popconfirm title="确认删除该 Key？" onConfirm={() => onDelete(record.id)}>
							<Button type="link" className="p-0" danger>
								删除
							</Button>
						</Popconfirm>
					</Space>
				),
			},
		],
		[handleCopyPrefix, onRevoke, onDelete],
	);

	return (
		<Table<ApiKeyItem>
			columns={columns}
			dataSource={dataSource}
			rowKey="id"
			loading={loading}
			pagination={{
				pageSize: 10,
				showTotal: (total) => `共 ${total} 条数据`,
			}}
			bordered
			size="middle"
			scroll={{ x: "max-content" }}
		/>
	);
};
