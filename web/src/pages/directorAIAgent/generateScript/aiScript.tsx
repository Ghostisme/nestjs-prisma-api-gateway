import type { IDomEditor } from "@wangeditor/editor";
import { Editor } from "@wangeditor/editor-for-react";
import { Modal } from "antd";
import dayjs from "dayjs";
import { useEffect, useRef } from "react";
import { useUnmount } from "react-use";
import { toast } from "sonner";
import {
	adoptAiScriptApi,
	copyAiScriptApi,
	editAiScriptContent,
	getAiScriptDetail,
	getRegenerateScriptId,
	getScriptAiList,
} from "@/api/directorAIAgent";
import type { AiScriptDetailRes, ScriptAiListRes } from "@/api/directorAIAgent/types.ts";
// import logo from "@/assets/images/directorAIAgent/logo.png";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Icon } from "@/components/icon";
import { useBrandSeriesModel, useCopyToClipboard, useReactive } from "@/hooks";
import { ScriptInformation } from "@/pages/directorAIAgent/scriptLibraryManagement/components";
import { LMX_ADMIN_PERMISSIONS } from "@/pages/rbac/permissions";
import { cn } from "@/utils";

export default ({ ids, delay, onChangeLoading, onChangeIds }: Props) => {
	const { copyFn } = useCopyToClipboard();
	const [modal, contextHolder] = Modal.useModal();
	const { list, timer1, timer2, visible, html, editor, record, cache, $refs, $reset } = useReactive<State>({
		list: [],
		timer1: void 0,
		timer2: void 0,
		visible: false,
		editor: null,
		html: "",
		record: null,
		cache: {},
	});
	const getAiList = async (ids: number[]) => {
		const res = await getScriptAiList(ids);
		$refs.list = res.map((it) => {
			const { id } = it;
			cache[id] = cache[id] || 0;
			return { ...it, progress: cache[id] };
		});
		if (res.every(({ status }) => status === "success" || status === "failure")) {
			return onClear();
		}
		$refs.timer1 = setTimeout(getAiList, delay, ids);
	};
	const startProgressSimulation = () => {
		$refs.timer2 = setInterval(() => {
			$refs.list.forEach((it) => {
				const { id } = it;
				const num = cache[id] + Math.floor(Math.random() * 3) + 1;
				cache[id] = it.progress = num > 99 ? 99 : num;
			});
		}, 500);
	};
	const onClear = () => {
		clearTimeout(timer1);
		clearInterval(timer2);
	};
	const onCopy = async ({ id, scriptContent }: Item) => {
		await adoptAiScriptApi(id);
		await copyAiScriptApi(id);
		copyFn(scriptContent, "采纳脚本案例并复制成功");
	};
	const onRefresh = async (id: number) => {
		if (
			await modal.confirm({
				title: "提示",
				content: "确认重新生成脚本案例吗？",
			})
		) {
			onChangeIds(id, await getRegenerateScriptId(id));
		}
	};
	const onEdit = async (id: number) => {
		const res = await getAiScriptDetail(id);
		const { scriptContent } = res;
		$refs.record = res;
		$refs.html = scriptContent;
		$refs.visible = true;
		editor?.setHtml(scriptContent);
	};
	const onSubmit = async () => {
		if (!html) {
			return toast.error("请输入脚本内容");
		}
		if (
			await modal.confirm({
				title: "提示",
				content: "确认编辑脚本案例内容吗？",
			})
		) {
			const { id: caseId } = record as AiScriptDetailRes;
			await editAiScriptContent({ caseId, scriptContent: html });
			(list.find(({ id }) => id === caseId) as Item).scriptContent = html;
			$refs.visible = false;
			toast.success("修改成功");
		}
	};
	useEffect(() => {
		onClear();
		if (ids.length) {
			getAiList(ids).then(() => {
				startProgressSimulation();
				onChangeLoading();
			});
		} else {
			$refs.list = [];
		}
	}, [ids]);
	useUnmount(onClear);
	return (
		<>
			{list.map((it, i) => {
				const { id, status } = it;
				return (
					<div className={"flex flex-col gap-[8px]"} key={it.id}>
						<div
							className={
								"bg-[linear-gradient(37.71deg,#F6F2FF_5%,#FAFCFF_40%,#E8EFFF_100%)] p-[16px] rounded-[8px] flex flex-col gap-[8px]"
							}
						>
							{(status === "init" || status === "processing") && <LoadingContent {...it} index={i} />}
							{status === "success" && <SuccessContent {...it} index={i} />}
							{status === "failure" && <FailContent {...it} onRefresh={() => onRefresh(id)} />}
						</div>
						{status === "success" && (
							<SuccessFooter {...it} onCopy={onCopy} onEdit={onEdit} onRefresh={() => onRefresh(id)} />
						)}
					</div>
				);
			})}
			<EditModal
				visible={visible}
				data={record}
				value={html}
				onEditorCreated={(editor) => {
					$refs.editor = editor;
				}}
				onChangeValue={(editor) => {
					$refs.html = editor.getHtml();
				}}
				onCancel={() => $reset(["visible", "html", "record"])}
				onSubmit={onSubmit}
			/>
			{contextHolder}
		</>
	);
};
const LoadingContent = ({ index, title, progress }: LoadingContentProps) => (
	<>
		<div
			className={
				"text-[16px] font-semibold bg-gradient-to-r from-[#4C84FE] from-[0%] via-[#24F3F3] via-[30%] to-[#5CDCFF] to-[100%] bg-clip-text text-transparent"
			}
		>
			脚本{index + 1}：{title}
		</div>
		<div className={"flex items-center justify-between"}>
			<div className={"text-[14px] text-[#86909C] flex items-center gap-[4px]"}>
				<Icon icon={"line-md:loading-loop"} size={16} color={"#86909C"} />
				AI 内容生成任务执行中 {progress}%...
			</div>
			{/* <div className={"text-[14px] text-[#4E5969] flex items-center gap-[4px]"}>
        <img src={logo} alt="" className={"w-[20px]"} />
        内容由嘉鹿提供
      </div> */}
		</div>
	</>
);
const SuccessContent = ({ index, title, scriptContent: __html }: LoadingContentProps) => {
	const { flag, showIcon, $refs } = useReactive({
		flag: false,
		showIcon: false,
	});
	const contentRef = useRef<HTMLDivElement>(null);
	// const columnNameMap: Record<string, string> = {
	//   分镜: "镜头",
	//   台词: "脚本内容",
	//   画面: "画面建议",
	// };
	useEffect(() => {
		if (contentRef.current) {
			const lineHeight = 22.4; // 14px 字体 * 1.6 line-height (Tailwind 默认)
			const maxHeight = lineHeight * 4;
			$refs.showIcon = contentRef.current.scrollHeight > maxHeight;
		}
	}, [__html]);
	return (
		<>
			<div
				className={
					"text-[16px] font-semibold bg-gradient-to-r from-[#4C84FE] from-[0%] via-[#24F3F3] via-[30%] to-[#5CDCFF] to-[100%] bg-clip-text text-transparent flex items-center justify-between"
				}
			>
				脚本{index + 1}：{title}
				{showIcon && (
					<Icon
						icon={flag ? "teenyicons:up-solid" : "teenyicons:down-solid"}
						size={10}
						color={"#1D2129"}
						className={"cursor-pointer"}
						onClick={() => {
							$refs.flag = !flag;
						}}
					/>
				)}
			</div>
			<div
				className={cn("text-[14px] text-[#4E5969] whitespace-pre-wrap", !flag && "line-clamp-4")}
				dangerouslySetInnerHTML={{ __html }}
				ref={contentRef}
			/>
		</>
	);
};
const SuccessFooter = ({ id, modelType, onCopy, onEdit, onRefresh, ...props }: SuccessFooterProps) => (
	<div className={"flex items-center justify-between"}>
		<div className={"flex items-center gap-[12px]"}>
			<AuthGuard check={LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage}>
				<Icon
					icon={"icon-park-outline:copy"}
					size={16}
					color={"#86909C"}
					className={"cursor-pointer"}
					onClick={() => onCopy({ id, modelType, ...props })}
				/>
			</AuthGuard>
			<AuthGuard check={LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage}>
				<Icon
					icon={"ri:edit-line"}
					size={16}
					color={"#86909C"}
					className={"cursor-pointer"}
					onClick={() => onEdit(id)}
				/>
			</AuthGuard>
			<AuthGuard check={LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage}>
				<Icon
					icon={"mynaui:refresh-solid"}
					size={16}
					color={"#86909C"}
					className={"cursor-pointer"}
					onClick={onRefresh}
				/>
			</AuthGuard>
		</div>
		{/* <div className={"text-[14px] text-[#4E5969] flex items-center gap-[4px]"}>
      <img src={logo} alt="" className={"w-[20px]"} />
      内容由嘉鹿提供
    </div> */}
	</div>
);
const FailContent = ({ sensitiveWords, onRefresh }: FailContentProps) => (
	<div className={"flex items-center justify-between"}>
		<div className={"text-[14px] text-[#F53F3F] flex items-center gap-[4px]"}>
			<Icon icon={"ix:error"} size={16} color={"#F53F3F"} />
			模型调用失败，
			{sensitiveWords && <span>包含敏感词“{sensitiveWords.join(",")}”，</span>}
			请重新发起命令。
		</div>
		<div className={"text-[14px] text-[#165DFF] flex items-center gap-[4px] cursor-pointer"} onClick={onRefresh}>
			<Icon icon={"mynaui:refresh-solid"} size={16} color={"#165DFF"} />
			重新生成
		</div>
	</div>
);
const EditModal = ({ visible, data, value, onEditorCreated, onChangeValue, onCancel, onSubmit }: EditModalProps) => {
	const { getBrandSeriesContent } = useBrandSeriesModel();
	return (
		<Modal
			open={visible}
			width={622}
			destroyOnHidden
			onCancel={onCancel}
			title={<ScriptInformation {...data} />}
			onOk={onSubmit}
		>
			{data && (
				<>
					<div className={"text-[#86909C] text-[14px] mt-[20px] flex items-center justify-between"}>
						品牌/车系/车型
						<span className={"text-[#4E5969] text-[14px]"}>{getBrandSeriesContent(data)}</span>
					</div>
					<div className={"text-[#86909C] text-[14px] mt-[5px]  flex items-center justify-between"}>
						更新时间
						<span className={"text-[#4E5969] text-[14px]"}>{dayjs(data.updateTime).format("YYYY-MM-DD HH:mm:ss")}</span>
					</div>
				</>
			)}
			<Editor
				defaultConfig={{ placeholder: "请输入内容..." }}
				value={value}
				onCreated={onEditorCreated}
				onChange={onChangeValue}
				style={{ height: "500px", overflowY: "hidden" }}
				className={"mt-[20px] rounded-[8px] border border-[#DDD]"}
			/>
		</Modal>
	);
};

interface Props {
	ids: number[];
	delay: number;
	onChangeLoading(): void;
	onChangeIds(id: number, nId: number): void;
}
interface LoadingContentProps extends Item {
	index: number;
}
interface FailContentProps extends Item {
	onRefresh(): void;
}
interface SuccessFooterProps extends FailContentProps, Item {
	onEdit(id: number): void;
	onCopy(record: Item): void;
}
interface EditModalProps {
	visible: boolean;
	data: State["record"];
	value: string;
	onEditorCreated(editor: IDomEditor): void;
	onChangeValue(editor: IDomEditor): void;
	onCancel(): void;
	onSubmit(): void;
}
interface State {
	list: Item[];
	timer1: number | undefined;
	timer2: number | undefined;
	visible: boolean;
	html: string;
	editor: IDomEditor | null;
	record: AiScriptDetailRes | null;
	cache: Record<number, number>;
}
interface Item extends ScriptAiListRes {
	progress: number;
}
