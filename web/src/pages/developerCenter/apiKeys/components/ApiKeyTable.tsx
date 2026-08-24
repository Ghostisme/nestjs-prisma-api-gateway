import { App, Button, Popconfirm, Space, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { type JSX, useCallback, useMemo } from "react";
import type { ApiKeyItem } from "../../types";

const STATUS_TAG_MAP: Record<string, { color: string; label: string }> = {
	active: { color: "green", label: "Active" },
	revoked: { color: "red", label: "Revoked" },
	expired: { color: "default", label: "Expired" },
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
			message.success("Copied");
		},
		[message],
	);

	const columns = useMemo<ColumnsType<ApiKeyItem>>(
		() => [
			{ title: "Name", dataIndex: "name", width: 160, ellipsis: true },
			{
				title: "Key Prefix",
				dataIndex: "keyPrefix",
				width: 180,
				render: (prefix: string) => (
					<Button type="link" className="p-0 font-mono" onClick={() => handleCopyPrefix(prefix)}>
						{prefix}***
					</Button>
				),
			},
			{
				title: "Scopes",
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
				title: "Status",
				dataIndex: "status",
				width: 100,
				align: "center",
				render: (status: string) => {
					const cfg = STATUS_TAG_MAP[status] ?? { color: "default", label: status };
					return <Tag color={cfg.color}>{cfg.label}</Tag>;
				},
			},
			{
				title: "Last Used",
				dataIndex: "lastUsedAt",
				width: 180,
				render: (v: string | null) => v ?? "—",
			},
			{ title: "Created", dataIndex: "createdAt", width: 180 },
			{
				title: "Actions",
				width: 160,
				fixed: "right",
				align: "center",
				render: (_: unknown, record: ApiKeyItem) => (
					<Space>
						{record.status === "active" && (
							<Popconfirm title="Revoke this Key? This cannot be undone." onConfirm={() => onRevoke(record.id)}>
								<Button type="link" className="p-0" danger>
									Revoke
								</Button>
							</Popconfirm>
						)}
						<Popconfirm title="Delete this Key?" onConfirm={() => onDelete(record.id)}>
							<Button type="link" className="p-0" danger>
								Delete
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
				showTotal: (total) => `${total} records`,
			}}
			bordered
			size="middle"
			scroll={{ x: "max-content" }}
		/>
	);
};
