import type { IDomEditor } from "@wangeditor/editor";
import { Editor } from "@wangeditor/editor-for-react";
import { Button, Modal } from "antd";
import dayjs from "dayjs";
import { type Ref, useEffect, useImperativeHandle } from "react";
import { toast } from "sonner";
import { editScriptCaseContent } from "@/api/directorAIAgent";
import { useCopyToClipboard, useReactive } from "@/hooks";
import { ScriptInformation } from "@/pages/directorAIAgent/scriptLibraryManagement/components";

export default ({ visible, data, onClose, onDelete, onRefresh, getBrandSeriesContent, ref }: Props) => {
	const { updateTime, scriptContent, id } = data;
	const { copyFn } = useCopyToClipboard();
	const [modal, contextHolder] = Modal.useModal();
	const { html, editor, isEdit, flag, $refs, $reset } = useReactive<State>({
		html: "",
		editor: null,
		isEdit: false,
		flag: false,
	});
	const onEdit = () => {
		$refs.html = scriptContent;
		$refs.flag = true;
		editor?.setHtml(scriptContent);
	};
	const onRemove = async () => {
		if (await modal.confirm({ title: "提示", content: "是否确认删除？" })) {
			await onDelete(data);
			onClose();
		}
	};
	const onCancel = () => {
		if (isEdit) {
			return onClose();
		}
		$refs.flag = false;
	};
	const onConfirm = async () => {
		if (!html) {
			return toast.error("请输入脚本内容");
		}
		await editScriptCaseContent({ caseId: id, scriptContent: html });
		toast.success("编辑成功");
		onRefresh();
		onClose();
	};
	useEffect(() => {
		if (!visible) {
			editor?.setHtml("");
			$reset();
		}
	}, [visible]);
	useImperativeHandle(ref, () => ({
		edit() {
			$refs.isEdit = true;
			onEdit();
		},
	}));
	return (
		<>
			<Modal
				open={visible}
				destroyOnHidden
				width={622}
				onCancel={onClose}
				title={<ScriptInformation {...data} />}
				footer={
					<div className={"flex items-center gap-[8px] justify-end"}>
						{flag ? (
							<>
								<Button onClick={onCancel}>取消</Button>
								<Button type={"primary"} onClick={onConfirm}>
									确认
								</Button>
							</>
						) : (
							<>
								<Button onClick={() => copyFn(scriptContent)}>复制</Button>
								<Button className="hidden!" onClick={onEdit}>
									编辑
								</Button>
								<Button danger variant={"solid"} onClick={onRemove}>
									删除
								</Button>
								<Button type={"primary"} onClick={() => onClose()}>
									我知道了
								</Button>
							</>
						)}
					</div>
				}
			>
				<div className={"text-[#86909C] text-[14px] mt-[20px] flex items-center justify-between"}>
					品牌/车系
					<span className={"text-[#4E5969] text-[14px]"}>{getBrandSeriesContent(data)}</span>
				</div>
				<div className={"text-[#86909C] text-[14px] mt-[5px]  flex items-center justify-between"}>
					更新时间
					<span className={"text-[#4E5969] text-[14px]"}>
						{updateTime ? dayjs(updateTime).format("YYYY-MM-DD HH:mm:ss") : "-"}
					</span>
				</div>
				{flag ? (
					<Editor
						defaultConfig={{ placeholder: "请输入内容..." }}
						value={html}
						onCreated={(editor) => {
							$refs.editor = editor;
						}}
						onChange={(editor) => {
							$refs.html = editor.getHtml();
						}}
						style={{ height: "500px", overflowY: "hidden" }}
						className={"mt-[20px] rounded-[8px] border border-[#DDD]"}
					/>
				) : (
					<div className={"mt-[20px] rounded-[8px] border border-[#DDD] max-h-[500px] overflow-y-auto p-[12px]"}>
						<div
							className={"whitespace-pre-wrap text-[#4E5969] text-[14px] font-sans m-0"}
							dangerouslySetInnerHTML={{ __html: scriptContent }}
						/>
					</div>
				)}
			</Modal>
			{contextHolder}
		</>
	);
};

interface Props {
	visible: boolean;
	data: Record<string, any>;
	onClose(): void;
	onDelete(data: Record<string, any>): Promise<void>;
	onRefresh(): void;
	getBrandSeriesContent(data: Record<string, any>): string;
	ref: Ref<any>;
}
interface State {
	html: string;
	editor: IDomEditor | null;
	isEdit: boolean;
	flag: boolean;
}
