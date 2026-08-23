import { Modal, Table } from "antd";
import { useMemo } from "react";
import type { ScriptAiListRes } from "@/api/directorAIAgent/types.ts";
import { parseScriptContent } from "./scriptContentUtils";
import { useBrandSeriesModel } from "@/hooks";

export default ({ visible, data, onCancel }: Props) => {
	const { getBrandSeriesContent } = useBrandSeriesModel();
	const tableData = useMemo(() => {
		if (!data?.scriptContent) {
			return {
				title: "",
				columns: [],
				body: [],
			};
		}
		const tableOpts = parseScriptContent(String(data.scriptContent));
		const last = tableOpts.columns.filter(({ dataIndex }) => dataIndex === "画面建议");
		const rest = tableOpts.columns.filter(({ dataIndex }) => dataIndex !== "画面建议");
		const columns = rest.concat(last).map((col) => ({
			...col,
			render: (value: string) => <span className="whitespace-pre-wrap">{value}</span>,
		}));
		return {
			title: tableOpts.title,
			columns,
			body: tableOpts.body,
		};
	}, [data]);
	const brandSeriesContent = useMemo(() => {
		if (!data) {
			return "";
		}
		return getBrandSeriesContent(data as Record<string, any>);
	}, [data, getBrandSeriesContent]);

	return (
		<Modal
			open={visible}
			width={"92vw"}
			centered
			destroyOnHidden
			footer={null}
			onCancel={onCancel}
			title={data?.title ? `${String(data.title)}` : "放大查看"}
		>
			{Boolean(brandSeriesContent) && (
				<div className={"text-[#86909C] text-[14px] mt-[6px] mb-[12px]"}>
					品牌/车系：
					<span className={"text-[#4E5969]"}>{brandSeriesContent}</span>
				</div>
			)}
			<div
				className={
					"text-[16px] font-semibold bg-gradient-to-r from-[#4C84FE] from-[0%] via-[#24F3F3] via-[30%] to-[#5CDCFF] to-[100%] bg-clip-text text-transparent mb-[12px]"
				}
			>
				{tableData.title || "脚本内容"}
			</div>
			<Table
				dataSource={tableData.body}
				columns={tableData.columns}
				pagination={false}
				size={"small"}
				scroll={{ x: "max-content" }}
				rowKey={(_, index) => String(index)}
				// index 为当前行的索引
				rowClassName={(_, index) => (index % 2 === 1 ? "bg-[rgba(248,250,255,0.8)]" : "")}
			/>
		</Modal>
	);
};

type ZoomData = ScriptAiListRes & {
	progress?: number;
	subBrandName?: string;
	seriesName?: string;
	modelName?: string;
};

interface Props {
	visible: boolean;
	data: ZoomData | null;
	onCancel(): void;
}
