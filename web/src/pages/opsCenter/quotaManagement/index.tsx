import { Button, Card, Col, InputNumber, Modal, Progress, Row, Spin, Switch, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { JSX } from "react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import usageMeteringService from "@/api/services/usageMeteringService";
import subscriptionService from "@/api/services/subscriptionService";
import type { QuotaRule, QuotaStatus } from "../types";

const { Title, Text } = Typography;

const DEFAULT_QUOTA: QuotaStatus = {
	planTier: "-",
	tokenLimit: 0,
	tokenUsed: 0,
	tokenRemaining: 0,
	usagePercent: 0,
	callsThisMonth: 0,
	concurrentLimit: 0,
};

function formatTokenCount(num: number): string {
	if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
	if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
	return num.toString();
}

export default function QuotaManagement(): JSX.Element {
	const { data: quota = DEFAULT_QUOTA, isLoading: quotaLoading } = useQuery<QuotaStatus>({
		queryKey: ["quota-status"],
		queryFn: () => usageMeteringService.getQuotaStatus(),
	});
	const { data: rules = [], isLoading: rulesLoading } = useQuery<QuotaRule[]>({
		queryKey: ["quota-rules"],
		queryFn: () => subscriptionService.getPlans(),
	});
	const [editModalOpen, setEditModalOpen] = useState(false);

	const strokeColor = quota.usagePercent >= 90 ? "#ff4d4f" : quota.usagePercent >= 70 ? "#faad14" : "#52c41a";

	const columns = useMemo<ColumnsType<QuotaRule>>(
		() => [
			{
				title: "套餐等级",
				dataIndex: "planTier",
				key: "planTier",
				render: (val: string) => <Tag color="blue">{val}</Tag>,
			},
			{
				title: "Token 上限",
				dataIndex: "tokenLimit",
				key: "tokenLimit",
				align: "right",
				render: (val: number) => formatTokenCount(val),
			},
			{
				title: "调用次数上限",
				dataIndex: "callsLimit",
				key: "callsLimit",
				align: "right",
				render: (val: number) => val.toLocaleString(),
			},
			{
				title: "并发限制",
				dataIndex: "concurrentLimit",
				key: "concurrentLimit",
				align: "center",
			},
			{
				title: "速率限制 (次/分)",
				dataIndex: "rateLimit",
				key: "rateLimit",
				align: "center",
			},
			{
				title: "状态",
				dataIndex: "enabled",
				key: "enabled",
				align: "center",
				render: (val: boolean) => <Switch checked={val} size="small" />,
			},
			{
				title: "更新时间",
				dataIndex: "updatedAt",
				key: "updatedAt",
			},
			{
				title: "操作",
				key: "action",
				align: "center",
				render: () => (
					<Button type="link" icon={<EditOutlined />} onClick={() => setEditModalOpen(true)}>
						编辑
					</Button>
				),
			},
		],
		[],
	);

	return (
		<Spin spinning={quotaLoading || rulesLoading}>
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<Title level={4} className="!mb-0">
						配额管理
					</Title>
					<Button type="primary" icon={<PlusOutlined />} onClick={() => setEditModalOpen(true)}>
						新增规则
					</Button>
				</div>

				<Row gutter={[16, 16]}>
					<Col xs={24} lg={8}>
						<Card title="当前配额概览">
							<div className="space-y-4">
								<div className="flex justify-between">
									<Text>套餐等级</Text>
									<Tag color="blue">{quota.planTier}</Tag>
								</div>
								<div>
									<div className="flex justify-between mb-1">
										<Text type="secondary">Token 使用率</Text>
										<Text>{Math.round(quota.usagePercent)}%</Text>
									</div>
									<Progress percent={Math.round(quota.usagePercent)} strokeColor={strokeColor} showInfo={false} />
								</div>
								<div className="flex justify-between">
									<Text type="secondary">已用 / 总量</Text>
									<Text>
										{formatTokenCount(quota.tokenUsed)} / {formatTokenCount(quota.tokenLimit)}
									</Text>
								</div>
								<div className="flex justify-between">
									<Text type="secondary">本月调用次数</Text>
									<Text>{quota.callsThisMonth.toLocaleString()}</Text>
								</div>
								<div className="flex justify-between">
									<Text type="secondary">并发上限</Text>
									<Text>{quota.concurrentLimit}</Text>
								</div>
							</div>
						</Card>
					</Col>
					<Col xs={24} lg={16}>
						<Card title="配额规则列表">
							<Table<QuotaRule>
								columns={columns}
								dataSource={rules}
								rowKey="id"
								pagination={false}
								size="middle"
								bordered
							/>
						</Card>
					</Col>
				</Row>

				<Modal
					title="编辑配额规则"
					open={editModalOpen}
					onCancel={() => setEditModalOpen(false)}
					onOk={() => setEditModalOpen(false)}
					destroyOnClose
				>
					<div className="space-y-4 py-4">
						<div className="flex items-center justify-between">
							<Text>Token 上限</Text>
							<InputNumber min={0} step={100_000} defaultValue={1_000_000} style={{ width: 200 }} />
						</div>
						<div className="flex items-center justify-between">
							<Text>调用次数上限</Text>
							<InputNumber min={0} step={1_000} defaultValue={5_000} style={{ width: 200 }} />
						</div>
						<div className="flex items-center justify-between">
							<Text>并发限制</Text>
							<InputNumber min={1} max={500} defaultValue={20} style={{ width: 200 }} />
						</div>
						<div className="flex items-center justify-between">
							<Text>速率限制 (次/分)</Text>
							<InputNumber min={1} max={1000} defaultValue={30} style={{ width: 200 }} />
						</div>
					</div>
				</Modal>
			</div>
		</Spin>
	);
}
