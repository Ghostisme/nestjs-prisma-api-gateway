import { Input, message, Table } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { editAiScriptContent } from "@/api/directorAIAgent";
import { Icon } from "@/components/icon";
import { cn } from "@/utils";
import { toScriptContent, parseScriptContent } from "./scriptContentUtils";

export default ({ caseId, scriptContent, hidden, onSaved }: Props) => {
	const tableOpts = useMemo(() => parseScriptContent(scriptContent), [scriptContent]);
	const orderedColumns = useMemo(() => {
		const cols = tableOpts?.columns || [];
		const last = cols.filter(({ dataIndex }) => dataIndex === "画面建议");
		const rest = cols.filter(({ dataIndex }) => dataIndex !== "画面建议");
		return rest.concat(last);
	}, [tableOpts?.columns]);
	const [body, setBody] = useState(tableOpts?.body || []);
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	const editingValueRef = useRef("");

	useEffect(() => {
		setBody(tableOpts?.body || []);
		setEditingIndex(null);
		editingValueRef.current = "";
	}, [tableOpts?.body]);

	const columns = useMemo(
		() =>
			orderedColumns.map((col) => {
				if (col.dataIndex !== "脚本内容") {
					return {
						...col,
						render(value: string) {
							return <span className="whitespace-pre-wrap">{value}</span>;
						},
					};
				}
				return {
					...col,
					render(value: string, _row: Record<string, string>, index: number) {
						if (editingIndex === index) {
							const handleSave = async () => {
								const nextBody = body.map((it, i) => (i === index ? { ...it, 脚本内容: editingValueRef.current } : it));
								const nextScriptContent = toScriptContent({
									...tableOpts,
									columns: orderedColumns,
									body: nextBody,
								});
								try {
									await editAiScriptContent({
										caseId,
										scriptContent: nextScriptContent,
									});
									setBody(nextBody);
									setEditingIndex(null);
									editingValueRef.current = "";
									onSaved(caseId, nextScriptContent);
									message.success("保存成功");
								} catch (error: any) {
									console.log(error);
									message.error(error.message || "保存失败，请稍后重试");
								}
							};

							return (
								<div className={"flex items-start gap-[6px]"}>
									<Input.TextArea
										key={`edit-${index}`}
										defaultValue={value || ""}
										autoSize={{ minRows: 1, maxRows: 6 }}
										onChange={({ target: { value } }) => {
											editingValueRef.current = value;
										}}
									/>
									<Icon
										icon={"mdi:check"}
										size={16}
										color={"#00B42A"}
										className={"cursor-pointer mt-1"}
										onClick={handleSave}
									/>
									<Icon
										icon={"mdi:close"}
										size={16}
										color={"#F53F3F"}
										className={"cursor-pointer mt-1"}
										onClick={() => {
											setEditingIndex(null);
											editingValueRef.current = "";
										}}
									/>
								</div>
							);
						}
						return (
							<div className={"group flex items-center gap-[6px]"}>
								<span
									className={"cursor-pointer whitespace-pre-wrap"}
									onClick={() => {
										setEditingIndex(index);
										editingValueRef.current = value || "";
									}}
								>
									{value}
								</span>
								<Icon
									icon={"ri:edit-line"}
									size={14}
									color={"#86909C"}
									className={"cursor-pointer opacity-0 transition-opacity group-hover:opacity-100"}
									onClick={() => {
										setEditingIndex(index);
										editingValueRef.current = value || "";
									}}
								/>
							</div>
						);
					},
				};
			}),
		[body, caseId, editingIndex, onSaved, orderedColumns, tableOpts],
	);

	return (
		<Table
			dataSource={body}
			columns={columns}
			className={cn("mt-[10px]", hidden ? "hidden" : "")}
			title={() => tableOpts?.title}
			scroll={{ x: "max-content" }}
			rowKey={(_, index) => index as number}
			pagination={false}
		/>
	);
};

interface Props {
	caseId: number;
	scriptContent: string;
	hidden: boolean;
	onSaved(caseId: number, scriptContent: string): void;
}
