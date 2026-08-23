import type { IDomEditor } from "@wangeditor/editor";
import { Editor } from "@wangeditor/editor-for-react";
import { message, Modal, Radio } from "antd";
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
	getScriptCaseList,
	getScriptAiList,
	scriptFeedback,
} from "@/api/directorAIAgent";
import type { AiScriptDetailRes, ScriptCaseStatusResponse, ScriptAiListRes } from "@/api/directorAIAgent/types.ts";
import empty1 from "@/assets/images/directorAIAgent/empty1.png";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Icon } from "@/components/icon";
import { useBrandSeriesModel, useCopyToClipboard, useReactive } from "@/hooks";
import { Empty } from "@/pages/directorAIAgent/generateScript/components";
import { ScriptInformation } from "@/pages/directorAIAgent/scriptLibraryManagement/components";
import { LMX_ADMIN_PERMISSIONS } from "@/pages/rbac/permissions";
import { downloadExcelFile } from "@/utils";
import { parseScriptContent } from "./scriptContentUtils";
import ExcelJS from "exceljs";
import EditableScriptTable from "./editableScriptTable";
import ZoomScriptModal from "./zoomScriptModal";

const onDownload = async ({ title, scriptContent }: Item) => {
	const tableOpts = parseScriptContent(scriptContent);
	const workbook = new ExcelJS.Workbook();
	const sheet = workbook.addWorksheet("脚本");

	sheet.addRow([tableOpts.title]);
	sheet.mergeCells(1, 1, 1, tableOpts.columns.length);

	sheet.addRow(tableOpts.columns.map((col) => col.title));
	for (const row of tableOpts.body) {
		sheet.addRow(tableOpts.columns.map((col) => row[col.dataIndex] ?? ""));
	}

	const headerRow = sheet.getRow(2);
	headerRow.font = { bold: true };
	for (const column of sheet.columns) {
		column.width = 20;
	}

	const buffer = await workbook.xlsx.writeBuffer();
	downloadExcelFile(buffer, `${title}.xlsx`);
};

export default ({ ids, delay, onChangeLoading, onChangeIds, loadHistoryCaseList = true }: Props) => {
	const { copyFn } = useCopyToClipboard();
	const [modal, contextHolder] = Modal.useModal();
	const caseListRef = useRef<Item[]>([]);
	const hasLoadedHistoryRef = useRef(false);
	const {
		list,
		timer1,
		timer2,
		visible,
		zoomVisible,
		html,
		editor,
		record,
		zoomRecord,
		cache,
		isLoading,
		$refs,
		$reset,
	} = useReactive<State>({
		list: [],
		timer1: void 0,
		timer2: void 0,
		visible: false,
		zoomVisible: false,
		editor: null,
		html: "",
		record: null,
		zoomRecord: null,
		cache: {},
		isLoading: false,
	});
	const formatList = (res: ScriptCaseStatusResponse[]) =>
		res
			.filter((it) => typeof it.id === "number")
			.map((it) => {
				const id = it.id as number;
				cache[id] = cache[id] || 0;
				return {
					id,
					title: it.title || "",
					status: it.status || "init",
					modelType: it.modelType || "",
					scriptContent: it.scriptContent || "",
					hasSensitiveWord: Boolean(it.hasSensitiveWord),
					sensitiveWords: it.sensitiveWords || [],
					progress: cache[id],
				};
			});
	const formatStatusList = (res: ScriptAiListRes[]) =>
		res.map((it) => {
			const { id } = it;
			cache[id] = cache[id] || 0;
			return { ...it, progress: cache[id] };
		});
	const mergeList = (head: Item[], tail: Item[]) => {
		const map = new Map<number, Item>();
		head.forEach((it) => map.set(it.id, it));
		tail.forEach((it) => {
			if (!map.has(it.id)) {
				map.set(it.id, it);
			}
		});
		return [...map.values()];
	};
	const queryList = async (currentIds: number[], shouldLoadCaseList = false) => {
		if (shouldLoadCaseList) {
			$refs.isLoading = true;
		}
		let caseList = caseListRef.current;
		let statusList: Item[] = [];
		if (shouldLoadCaseList) {
			try {
				const res = await getScriptCaseList();
				caseList = formatList(res.slice(0, 10));
				caseListRef.current = caseList;
			} catch {
				caseList = [];
				caseListRef.current = [];
			}
		}
		if (currentIds.length) {
			try {
				// console.log("☀️currentIds====>", currentIds);
				const res = await getScriptAiList(currentIds);
				statusList = formatStatusList(res);
			} catch {
				statusList = [];
			}
		}
		const pendingList = currentIds
			.filter((id) => !statusList.some((it) => it.id === id))
			.map((id) => {
				const item = list.find((it) => it.id === id);
				return (
					item || {
						id,
						title: "",
						status: "processing",
						modelType: "",
						scriptContent: "",
						hasSensitiveWord: false,
						sensitiveWords: [],
						progress: cache[id] || 0,
					}
				);
			});
		$refs.list = mergeList([...pendingList, ...statusList], caseList);

		if (shouldLoadCaseList) {
			setTimeout(() => {
				$refs.isLoading = false;
			}, 500);
		}

		if (currentIds.length) {
			if (statusList.length && statusList.every(({ status }) => status === "success" || status === "failure")) {
				onClear();
			} else {
				$refs.timer1 = setTimeout(queryList, delay, currentIds, false);
			}
		}
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
	// const onCopy = async ({ id, scriptContent }: Item) => {
	//   await adoptAiScriptApi(id);
	//   await copyAiScriptApi(id);
	//   copyFn(scriptContent, "采纳脚本案例并复制成功");
	// };
	const onSave = async ({ id }: Item) => {
		try {
			await adoptAiScriptApi(id);
			toast.success("已加入脚本库");
		} catch {
			toast.error("加入脚本库失败");
		}
	};
	const onCopy = async ({ scriptContent, id }: Item) => {
		// 必须先执行剪贴板复制，保持用户手势上下文
		console.log(scriptContent, "scriptContent");
		copyFn(scriptContent, "复制成功");
		try {
			await copyAiScriptApi(id);
		} catch {
			// API 记录失败不影响已完成的复制
		}
	};
	const onRefresh = async (id: number) => {
		if (
			await modal.confirm({
				title: "提示",
				content: "确认重新生成脚本案例吗？",
			})
		) {
			const newId = await getRegenerateScriptId(id);
			onChangeIds(id, newId);
		}
	};
	const onFeedback = async (id: number) => {
		let feedbackFlag = 0;
		if (
			await modal.confirm({
				title: "反馈技术",
				content: (
					<Radio.Group
						defaultValue={feedbackFlag}
						onChange={({ target: { value } }) => {
							feedbackFlag = value;
						}}
					>
						<Radio value={0}>满意</Radio>
						<Radio value={1}>不满意</Radio>
					</Radio.Group>
				),
			})
		) {
			try {
				await scriptFeedback({
					caseId: id,
					feedbackFlag,
				});
				message.success("反馈成功");
			} catch {
				message.error("反馈失败，请稍后重试");
			}
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
	const onZoom = (record: Item) => {
		$refs.zoomRecord = record;
		$refs.zoomVisible = true;
	};
	const onUpdateScript = (id: number, scriptContent: string) => {
		const item = list.find((it) => it.id === id);
		if (item) {
			item.scriptContent = scriptContent;
		}
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
		const shouldLoadCaseList = loadHistoryCaseList && !hasLoadedHistoryRef.current;
		if (shouldLoadCaseList) {
			hasLoadedHistoryRef.current = true;
		}
		if (!ids.length && !shouldLoadCaseList) {
			// caseListRef.current = [];
			// $refs.cache = {};
			// $refs.list = [];
			// return;
		}
		queryList(ids, shouldLoadCaseList).then(() => {
			if (ids.length) {
				startProgressSimulation();
				onChangeLoading();
			}
		});
	}, [ids, loadHistoryCaseList]);
	useUnmount(onClear);
	if (isLoading) {
		return (
			<div className={"flex-1 flex flex-col items-center justify-center text-[#86909C] text-[14px]"}>
				<Icon icon="line-md:loading-loop" size={32} className="mb-4" />
				加载历史数据中...
			</div>
		);
	}
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
							{status === "success" && <SuccessContent {...it} index={i} onUpdateScript={onUpdateScript} />}
							{status === "failure" && <FailContent {...it} onRefresh={() => onRefresh(id)} />}
						</div>
						{status === "success" && (
							<SuccessFooter
								{...it}
								onSave={onSave}
								onCopy={onCopy}
								onEdit={onEdit}
								onZoom={onZoom}
								onDownload={onDownload}
								onRefresh={() => onRefresh(id)}
								onFeedback={onFeedback}
							/>
						)}
					</div>
				);
			})}
			{!list.length && (
				<Empty
					icon={empty1}
					title={"您暂时还没生成脚本哦!"}
					description={"输入相关信息，AI秒出专业脚本，快来使用吧!"}
				/>
			)}
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
			<ZoomScriptModal visible={zoomVisible} data={zoomRecord} onCancel={() => $reset(["zoomVisible", "zoomRecord"])} />
			{contextHolder}
		</>
	);
};
const LoadingContent = ({ index, title, progress }: LoadingContentProps) => (
	<>
		<div
			className={
				"text-[16px] font-semibold bg-linear-to-r from-[#4C84FE] from-0% via-[#24F3F3] via-30% to-[#5CDCFF] to-100% bg-clip-text text-transparent"
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
const SuccessContent = ({ index, id, title, scriptContent, onUpdateScript }: SuccessContentProps) => {
	const { flag, $refs } = useReactive({ flag: false });
	return (
		<>
			<div
				className={
					"text-[16px] font-semibold bg-linear-to-r from-[#4C84FE] from-0% via-[#24F3F3] via-30% to-[#5CDCFF] to-100% bg-clip-text text-transparent flex items-center justify-between"
				}
			>
				脚本{index + 1}：{title}
				<Icon
					icon={flag ? "teenyicons:up-solid" : "teenyicons:down-solid"}
					size={10}
					color={"#1D2129"}
					className={"cursor-pointer"}
					onClick={() => {
						$refs.flag = !flag;
					}}
				/>
			</div>
			<EditableScriptTable caseId={id} scriptContent={scriptContent} hidden={flag} onSaved={onUpdateScript} />
		</>
	);
};
const SuccessFooter = ({
	id,
	modelType,
	onSave,
	onCopy,
	onEdit,
	onZoom,
	onDownload,
	onRefresh,
	onFeedback,
	...props
}: SuccessFooterProps) => (
	// <div className={"flex items-center gap-[24px] text-[14px] text-[#86909C]"}>
	//   <div className={"flex items-center gap-[4px]"}>
	//     <Icon icon={"mdi:check-circle-outline"} size={16} color={"#00B42A"} />
	//     <span className={"text-[#00B42A]"}>已完成</span>
	//   </div>
	//   <AuthGuard check={LMX_ADMIN_PERMISSIONS.aiGeneratedScript_create}>
	//     <div
	//       className={"flex items-center gap-[4px] cursor-pointer"}
	//       onClick={() => onCopy({ id, modelType, ...props })}
	//     >
	//       <Icon icon={"mdi:library-plus-outline"} size={16} color={"#86909C"} />
	//       加入脚本库
	//     </div>
	//   </AuthGuard>
	//   <div className={"flex items-center gap-[4px] cursor-pointer"}>
	//     <Icon icon={"mdi:message-alert-outline"} size={16} color={"#86909C"} />
	//     反馈技术
	//   </div>
	//   <div
	//     className={"flex items-center gap-[4px] cursor-pointer"}
	//     onClick={() => onCopy({ id, modelType, ...props })}
	//   >
	//     <Icon icon={"icon-park-outline:copy"} size={16} color={"#86909C"} />
	//     复制
	//   </div>
	//   <AuthGuard check={LMX_ADMIN_PERMISSIONS.aiGeneratedScript_regenerate}>
	//     <div
	//       className={"flex items-center gap-[4px] cursor-pointer"}
	//       onClick={onRefresh}
	//     >
	//       <Icon icon={"mynaui:refresh-solid"} size={16} color={"#86909C"} />
	//       重新生成
	//     </div>
	//   </AuthGuard>
	//   <div className={"flex items-center gap-[4px] cursor-pointer"}>
	//     <Icon icon={"mdi:download-outline"} size={16} color={"#86909C"} />
	//     下载脚本
	//   </div>
	// </div>
	<div className={"flex items-center justify-between text-[14px] text-[#86909C] border-t border-[#E5E6EB] pt-[12px]"}>
		<div className={"flex items-center gap-[4px]"}>
			<Icon icon={"mdi:check-circle-outline"} size={16} color={"#00B42A"} />
			<span className={"text-[#00B42A]"}>已完成</span>
		</div>
		<div className="flex gap-[8px]">
			<div
				className={"flex items-center gap-[4px] cursor-pointer hover:text-(--ant-color-primary)"}
				onClick={() => onZoom({ id, modelType, ...props } as Item)}
			>
				<Icon icon={"icon-park-outline:zoom-in"} size={16} />
				放大查看
			</div>
			<AuthGuard check={LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage}>
				<div
					className={"flex items-center gap-[4px] cursor-pointer  hover:text-(--ant-color-primary)"}
					// onClick={() => onCopy({ id, modelType, ...props })}
					onClick={() => onSave({ id, modelType, ...props } as Item)}
				>
					<Icon icon={"boxicons:like"} size={16} />
					加入脚本库
				</div>
			</AuthGuard>
			<div
				className={"flex items-center gap-[4px] cursor-pointer  hover:text-(--ant-color-primary)"}
				onClick={() => onFeedback(id)}
			>
				<Icon icon={"tabler:message"} size={16} />
				反馈技术
			</div>
			{/* <AuthGuard check={LMX_ADMIN_PERMISSIONS.aiGeneratedScript_update}>
        <div
          className={"flex items-center gap-[4px] cursor-pointer"}
          // onClick={() => onCopy({ id, modelType, ...props })}
          onClick={() => onEdit(id)}
        >
          <Icon
            icon={"ri:edit-line"}
            size={16}
            color={"#86909C"}
            className={"cursor-pointer"}
          />
          编辑脚本库
        </div>
      </AuthGuard> */}
			<div
				className={"flex items-center gap-[4px] cursor-pointer  hover:text-(--ant-color-primary)"}
				onClick={() => onCopy({ id, modelType, ...props } as Item)}
			>
				<Icon icon={"icon-park-outline:copy"} size={16} />
				复制
			</div>
			<AuthGuard check={LMX_ADMIN_PERMISSIONS.aiDashboard_tokenUsage}>
				<div
					className={"flex items-center gap-[4px] cursor-pointer  hover:text-(--ant-color-primary)"}
					onClick={onRefresh}
				>
					<Icon icon={"mynaui:refresh-solid"} size={16} />
					重新生成
				</div>
			</AuthGuard>
			<div
				className={"flex items-center gap-[4px] cursor-pointer  hover:text-(--ant-color-primary)"}
				onClick={() => onDownload({ id, modelType, ...props } as Item)}
			>
				<Icon icon={"mdi:download-outline"} size={16} />
				下载脚本
			</div>
		</div>
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
						品牌/车系
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
	loadHistoryCaseList?: boolean;
}
interface LoadingContentProps extends Item {
	index: number;
}
interface SuccessContentProps extends LoadingContentProps {
	onUpdateScript(id: number, scriptContent: string): void;
}
interface FailContentProps extends Item {
	onRefresh(): void;
}
interface SuccessFooterProps extends FailContentProps, Item {
	onSave(record: Item): void;
	onEdit(id: number): void;
	onZoom(record: Item): void;
	onCopy(record: Item): void;
	onDownload(record: Item): void;
	onFeedback(id: number): void;
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
	zoomVisible: boolean;
	html: string;
	editor: IDomEditor | null;
	record: AiScriptDetailRes | null;
	zoomRecord: Item | null;
	cache: Record<number, number>;
	isLoading: boolean;
}
interface Item extends ScriptAiListRes {
	progress: number;
}
// interface TableOpts {
//   title: string;
//   columns: Record<string, any>[];
//   body: Record<string, any>[];
// }
