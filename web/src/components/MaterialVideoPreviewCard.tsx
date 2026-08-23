import type React from "react";
import type { MaterialRow } from "@/api/material/types";
import { Icon } from "@/components/icon";
import { Button } from "@/ui/button";
import { buildMaterialFileUrl } from "@/utils/materialFileUrl";

const SIZE_UNITS = ["B", "KB", "MB", "GB", "TB"] as const;
const DEFAULT_CARD_WIDTH = 240;
const DEFAULT_CARD_HEIGHT = 280;
const DEFAULT_CARD_RADIUS = 20;

function formatDuration(sec?: number): string {
	if (sec == null || Number.isNaN(sec)) return "-";
	const m = Math.floor(sec / 60);
	const s = Math.floor(sec % 60);
	return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatSize(size: string | undefined): string {
	if (!size) return "";
	let index = 0;
	let num = Number.parseFloat(size);
	while (num >= 1024 && index < SIZE_UNITS.length - 1) {
		num /= 1024;
		index += 1;
	}
	return `${num.toFixed(2)} ${SIZE_UNITS[index]}`;
}

export type MaterialVideoPreviewCardProps = {
	row: MaterialRow;
	fileHost?: string;
	width?: number;
	height?: number;
	borderRadius?: number;
	showDownload?: boolean;
	checkboxNode?: React.ReactNode;
	onPlay?: (payload: { url: string; title: string; row: MaterialRow }) => void;
	onDownload?: () => void;
};

export function MaterialVideoPreviewCard({
	row,
	fileHost = "",
	width = DEFAULT_CARD_WIDTH,
	height = DEFAULT_CARD_HEIGHT,
	borderRadius = DEFAULT_CARD_RADIUS,
	showDownload = false,
	checkboxNode,
	onPlay,
	onDownload,
}: MaterialVideoPreviewCardProps) {
	const coverUrl = buildMaterialFileUrl(fileHost, row.coverUrl);
	const objectUrl = buildMaterialFileUrl(fileHost, row.objectUrl);

	return (
		<div className="relative z-[2] flex cursor-pointer shrink-0 items-center justify-center" style={{ width, height }}>
			<button
				type="button"
				aria-label={`播放视频：${row.name}`}
				className="absolute inset-0 z-[66] border-0 bg-transparent p-0"
				style={{ borderRadius }}
				onClick={() => onPlay?.({ url: objectUrl, title: row.name, row })}
			/>
			<img
				src={coverUrl || ""}
				alt=""
				className="h-full w-full object-cover"
				style={{
					borderRadius,
					background: "linear-gradient(180deg, rgb(0 0 0 / 0%) 58%, #000 100%)",
				}}
			/>
			<div
				className="pointer-events-none absolute inset-0"
				style={{
					borderRadius,
					background: "linear-gradient(180deg, rgb(0 0 0 / 0%) 58%, #000 100%)",
				}}
			/>
			<div
				className={`absolute left-4 top-4 z-[66] flex h-5 items-center ${checkboxNode != null ? "justify-between" : "justify-end"}`}
				style={{ width: "87%", gap: "0.65rem" }}
			>
				{checkboxNode != null && (
					<div
						className={[
							"flex items-center justify-center rounded",
							"[&_.ant-checkbox-inner]:size-4 [&_.ant-checkbox-inner]:border-white",
							"[&_.ant-checkbox:not(.ant-checkbox-checked)_.ant-checkbox-inner]:!bg-transparent",
							"[&_.ant-checkbox-inner::after]:border-white",
						].join(" ")}
						style={{
							boxSizing: "border-box",
							width: "24px",
							height: "24px",
							backgroundColor: "rgb(0 0 0 / 60%)",
						}}
					>
						{checkboxNode}
					</div>
				)}

				<div
					className="flex h-full items-center justify-center rounded px-1 py-1"
					style={{
						width: "2.375rem",
						backgroundColor: "rgb(0 0 0 / 60%)",
					}}
				>
					<span className="flex items-center text-xs text-white">{formatDuration(row.durationSec)}</span>
				</div>
			</div>
			<div
				className="absolute left-1/2 top-1/2 z-[3] flex size-[52px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
				style={{ backgroundColor: "rgb(0 0 0 / 60%)" }}
			>
				<Icon icon="solar:play-bold" className="text-xl" color="white" />
			</div>
			<div
				className="absolute bottom-4 left-4 z-[4] flex h-5 items-center justify-between"
				style={{ width: "87%", gap: "0.65rem" }}
			>
				<div
					className="flex items-center gap-2.5 rounded px-1 py-1"
					style={{
						backgroundColor: "rgb(0 0 0 / 60%)",
					}}
				>
					<span className="flex items-center gap-1.5 text-xs text-white">
						<Icon icon="material-symbols:save-outline-rounded" className="size-3.5" />
						{formatSize(row.size)}
					</span>
					<span className="flex items-center gap-1.5 text-xs text-white">
						<Icon icon="fluent:scan-camera-20-filled" className="size-3.5" />
						{row.resolution ?? "-"}
					</span>
				</div>
				{showDownload ? (
					<div
						className="flex items-center rounded px-1 py-1"
						style={{
							width: "2.375rem",
							backgroundColor: "rgb(0 0 0 / 60%)",
						}}
					>
						<Button
							variant="link"
							className="h-auto p-0 text-xs text-white"
							onClick={(e) => {
								e.stopPropagation();
								onDownload?.();
							}}
						>
							<Icon icon="line-md:download" className="mr-0.5 size-3.5" />
							{row.downloadCount ?? 0}
						</Button>
					</div>
				) : null}
			</div>
		</div>
	);
}
