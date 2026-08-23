import { Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { type JSX, useMemo } from "react";
import { Icon } from "@/components/icon";
import type { ConversationBannedWordHit } from "../../types";

interface BannedWordDetectionProps {
	hits: ConversationBannedWordHit[];
}

export const BannedWordDetection = ({ hits }: BannedWordDetectionProps): JSX.Element => {
	const columns = useMemo<ColumnsType<ConversationBannedWordHit>>(
		() => [
			{
				title: "触发时间",
				dataIndex: "triggerTime",
				width: 180,
				align: "center",
			},
			{
				title: "触发违禁词",
				dataIndex: "triggeredWord",
				width: 150,
				align: "center",
				render: (val: string) => (
					<Tag color="error" className="font-medium">
						{val}
					</Tag>
				),
			},
			{
				title: "触发语句",
				dataIndex: "triggerSentence",
				align: "center",
			},
		],
		[],
	);

	return (
		<div className="rounded-xl bg-[var(--card)] shadow-sm border border-[var(--border)] overflow-hidden">
			<div
				className="px-6 py-3 border-b border-[var(--border)]"
				style={{
					background:
						hits.length > 0
							? "linear-gradient(135deg, var(--colors-palette-error-lighter) 0%, var(--card) 100%)"
							: undefined,
				}}
			>
				<div className="flex items-center gap-2">
					<div
						className="w-1 h-5 rounded-full"
						style={{
							background: hits.length > 0 ? "var(--colors-palette-error-default)" : "var(--colors-palette-gray-400)",
						}}
					/>
					<h3 className="text-base font-bold text-[var(--foreground)]">检测违禁词</h3>
					{hits.length > 0 && (
						<Tag color="error" className="ml-2">
							<Icon icon="lucide:alert-triangle" size={12} className="mr-1 align-middle" />
							{hits.length} 次触发
						</Tag>
					)}
					{hits.length === 0 && (
						<Tag color="success" className="ml-2">
							<Icon icon="lucide:check-circle" size={12} className="mr-1 align-middle" />
							未检测到违禁词
						</Tag>
					)}
				</div>
			</div>

			<div className="p-4">
				<Table<ConversationBannedWordHit>
					columns={columns}
					dataSource={hits}
					rowKey={(_, idx) => String(idx)}
					pagination={false}
					bordered
					size="small"
					locale={{ emptyText: "本次对话未触发违禁词" }}
				/>
			</div>
		</div>
	);
};
