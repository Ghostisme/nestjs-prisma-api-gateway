import { Progress } from "antd";
import { memo, useMemo } from "react";
import { Icon } from "@/components/icon";
import { AppTabs } from "./AppTabs";

export type UploadTaskStatus = "pending" | "uploading" | "paused" | "success" | "error";

export type UploadTask = {
	uid: string;
	file: File;
	name: string;
	sizeText: string;
	status: UploadTaskStatus;
	percent: number;
	speedText: string;
	preview?: string;
	uploadedSizeText?: string;
	submitStatus?: "idle" | "submitting" | "error";
	errorMessage?: string;
};

export type UploadTabKey = "all" | "uploading" | "pending" | "success";

type AppFileListProps = {
	tasks: UploadTask[];
	activeTab: UploadTabKey;
	onTabChange: (tab: UploadTabKey) => void;
	onRemove: (task: UploadTask) => void;
	onStart: (task: UploadTask) => void;
	onPause: (task: UploadTask) => void;
	onRetry: (task: UploadTask) => void;
};

const TAB_ITEMS: Array<{ key: UploadTabKey; label: string }> = [
	{ key: "all", label: "全部" },
	{ key: "uploading", label: "上传中" },
	{ key: "pending", label: "待上传" },
	{ key: "success", label: "已上传" },
];

// Module-level constant: stable reference, never triggers AppTabs re-render due to new array
const APP_TABS_ITEMS = TAB_ITEMS.map((item) => ({ label: item.label, value: item.key }));

const EMPTY_VTT_TRACK = "data:text/vtt,WEBVTT";

function statusText(status: UploadTaskStatus): string {
	if (status === "success") return "上传完成";
	if (status === "uploading") return "上传中";
	if (status === "paused") return "已暂停";
	if (status === "pending") return "待上传";
	return "上传失败";
}

type UploadTaskItemProps = {
	task: UploadTask;
	onRemove: (task: UploadTask) => void;
	onStart: (task: UploadTask) => void;
	onPause: (task: UploadTask) => void;
	onRetry: (task: UploadTask) => void;
};

// Custom comparator: only re-render the item whose upload-relevant fields actually changed.
// Non-uploading items (pending/success) are shielded from re-renders triggered by
// other tasks' progress updates.
function uploadTaskPropsEqual(prev: UploadTaskItemProps, next: UploadTaskItemProps): boolean {
	return (
		prev.task.uid === next.task.uid &&
		prev.task.status === next.task.status &&
		prev.task.percent === next.task.percent &&
		prev.task.speedText === next.task.speedText &&
		prev.task.uploadedSizeText === next.task.uploadedSizeText &&
		prev.task.submitStatus === next.task.submitStatus &&
		prev.task.errorMessage === next.task.errorMessage &&
		prev.onRemove === next.onRemove &&
		prev.onStart === next.onStart &&
		prev.onPause === next.onPause &&
		prev.onRetry === next.onRetry
	);
}

const UploadTaskItem = memo(function UploadTaskItem({
	task,
	onRemove,
	onStart,
	onPause,
	onRetry,
}: UploadTaskItemProps) {
	const actionText =
		task.submitStatus === "submitting"
			? "素材创建中..."
			: task.submitStatus === "error"
				? task.errorMessage || "素材创建失败"
				: task.speedText || statusText(task.status);

	return (
		<div className="rounded-xl border border-[#dde0ee] bg-[#f6f7fb] p-4">
			<div className="flex items-center gap-4">
				<div className="group relative h-[80px] w-[80px] shrink-0 overflow-hidden rounded-lg bg-[#e9ecf8]">
					{task.preview && task.file.type.startsWith("image/") ? (
						<img src={task.preview} alt="" className="h-full w-full object-cover" />
					) : task.preview && task.file.type.startsWith("video/") ? (
						<video src={task.preview} className="h-full w-full object-cover" controls>
							<track kind="captions" src={EMPTY_VTT_TRACK} srcLang="zh-CN" label="默认字幕" />
						</video>
					) : (
						<div className="flex h-full w-full items-center justify-center text-[#8b90a7]">
							<Icon icon="icon-park-outline:file" width={24} />
						</div>
					)}
					{task.preview && (
						<div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.28)] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
							<Icon icon="icon-park-outline:play" width={20} className="text-white" />
						</div>
					)}
				</div>

				<div className="min-w-0 flex-1">
					<div className="truncate text-[14px] text-[#1d2129]">{task.name}</div>
					<div className="mt-1">
						<Progress
							percent={task.percent}
							showInfo={false}
							strokeColor={task.status === "error" ? "#ef4444" : "#165DFF"}
							railColor="#e0e3ef"
						/>
					</div>
					<div className="mt-1 flex items-center justify-between text-[16px] text-[#7a8098]">
						<div className="text-[12px] text-[#86909C]">
							{task.uploadedSizeText ?? `${((task.file.size * task.percent) / 100 / 1024 / 1024).toFixed(2)} MB`} /{" "}
							{task.sizeText}
						</div>
						<div className="flex items-center gap-3 text-[#5f647a]">
							<span className={task.submitStatus === "error" ? "text-[#ef4444]" : undefined}>{actionText}</span>
							{task.status === "pending" || task.status === "paused" ? (
								<button
									type="button"
									className="text-[#7344e5] transition-colors hover:text-[#5a33b6]"
									onClick={() => onStart(task)}
									title={task.status === "paused" ? "继续上传" : "开始上传"}
								>
									<Icon icon="icon-park-outline:play" width={20} />
								</button>
							) : null}
							{task.status === "uploading" ? (
								<button
									type="button"
									className="text-[#f59e0b] transition-colors hover:text-[#d97706]"
									onClick={() => onPause(task)}
									title="暂停上传"
								>
									<Icon icon="icon-park-outline:pause" width={20} />
								</button>
							) : null}
							{task.status === "error" ? (
								<button
									type="button"
									className="text-[#7344e5] transition-colors hover:text-[#5a33b6]"
									onClick={() => onRetry(task)}
									title="重试上传"
								>
									<Icon icon="icon-park-outline:refresh" width={20} />
								</button>
							) : null}
							{task.status === "pending" || task.status === "paused" ? (
								<button
									type="button"
									className="text-[#ef4444] transition-colors hover:text-[#dc2626]"
									onClick={() => onRemove(task)}
									title="删除任务"
								>
									<Icon icon="icon-park-outline:delete" width={20} />
								</button>
							) : null}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}, uploadTaskPropsEqual);

export function AppFileList({ tasks, activeTab, onTabChange, onRemove, onStart, onPause, onRetry }: AppFileListProps) {
	const filteredTasks = useMemo(
		() =>
			tasks.filter((task) => {
				if (activeTab === "all") return true;
				if (activeTab === "uploading") return task.status === "uploading" || task.status === "paused";
				if (activeTab === "pending") return task.status === "pending";
				return task.status === "success";
			}),
		[tasks, activeTab],
	);

	return (
		<div className="mt-6">
			{tasks.length > 0 && (
				<div className="mb-5 mt-6">
					<AppTabs
						bg={false}
						items={APP_TABS_ITEMS}
						active={TAB_ITEMS.findIndex((item) => item.key === activeTab)}
						onChange={(index) => onTabChange(TAB_ITEMS[index]?.key ?? "all")}
					/>
				</div>
			)}

			<div className="flex max-h-85 flex-col gap-4 overflow-y-auto pr-1">
				{filteredTasks.length === 0 ? (
					<div className="py-8 text-center text-[#8b90a7]">暂无文件</div>
				) : (
					filteredTasks.map((task) => (
						<UploadTaskItem
							key={task.uid}
							task={task}
							onRemove={onRemove}
							onStart={onStart}
							onPause={onPause}
							onRetry={onRetry}
						/>
					))
				)}
			</div>
		</div>
	);
}
