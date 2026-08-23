import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { JSX } from "react";
import { useMemo } from "react";
import type { TopUser } from "../../types";

interface TopUsersTableProps {
	data: TopUser[];
}

export default function TopUsersTable({ data }: TopUsersTableProps): JSX.Element {
	const columns = useMemo<ColumnsType<TopUser>>(
		() => [
			{
				title: "排名",
				key: "rank",
				width: 60,
				align: "center",
				render: (_, __, index) => index + 1,
			},
			{
				title: "用户",
				dataIndex: "username",
				key: "username",
				ellipsis: true,
			},
			{
				title: "Token 消耗",
				dataIndex: "tokensTotal",
				key: "tokensTotal",
				align: "right",
				sorter: (a, b) => a.tokensTotal - b.tokensTotal,
				render: (val: number) => val.toLocaleString(),
			},
			{
				title: "调用次数",
				dataIndex: "callsCount",
				key: "callsCount",
				align: "right",
				sorter: (a, b) => a.callsCount - b.callsCount,
				render: (val: number) => val.toLocaleString(),
			},
		],
		[],
	);

	return (
		<Table<TopUser> columns={columns} dataSource={data} rowKey="userId" pagination={false} size="middle" bordered />
	);
}
