import { Card, Empty, Spin, Typography } from "antd";
import { ApiOutlined } from "@ant-design/icons";
import type { JSX } from "react";
import { useQuery } from "@tanstack/react-query";
import llmModelService from "@/api/services/llmModelService";
import type { LlmModelItem } from "@/api/services/llmModelService";

const { Title, Text } = Typography;

function statusLabel(status: string): { text: string; active: boolean } {
	if (status === "enabled" || status === "active") return { text: "可用", active: true };
	if (status === "coming_soon") return { text: "即将上线", active: false };
	return { text: "停用", active: false };
}

export default function ModelsPage(): JSX.Element {
	const { data, isLoading } = useQuery({
		queryKey: ["llm-models"],
		queryFn: () => llmModelService.list({ pageSize: 100 }),
	});
	const models: LlmModelItem[] = data?.items ?? [];

	return (
		<Spin spinning={isLoading}>
			<div className="space-y-4">
				<h2 className="text-lg font-semibold text-[var(--foreground)]">模型管理</h2>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{models.map((model) => {
						const st = statusLabel(model.status);
						return (
							<Card key={model.id} hoverable className="border border-[var(--border)]">
								<div className="flex items-start gap-3">
									<div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
										<ApiOutlined className="text-xl" />
									</div>
									<div className="flex-1 min-w-0">
										<Title level={5} className="mb-1">
											{model.modelName}
										</Title>
										<Text type="secondary" className="text-sm">
											{model.provider}
										</Text>
										<div className="mt-2">
											<span
												className={`inline-block text-xs px-2 py-0.5 rounded-full ${
													st.active ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"
												}`}
											>
												{st.text}
											</span>
										</div>
									</div>
								</div>
							</Card>
						);
					})}
				</div>

				{models.length === 0 && !isLoading && (
					<Card className="border border-[var(--border)]">
						<Empty description="暂无模型数据" />
					</Card>
				)}
			</div>
		</Spin>
	);
}
