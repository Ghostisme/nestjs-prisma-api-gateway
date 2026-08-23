/** 视频信息行（封面 + 元信息 + 点击播放）：对应 xdwx-admin AppVideoInfo.vue */

import { Tooltip } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import type { MaterialRow } from "@/api/material/types";
import defaultCarLogo from "@/assets/material/carLog.png";
import { Icon } from "@/components/icon";
import { VideoPlayModal } from "@/components/VideoPlayModal";
import { cn } from "@/utils";
import { buildMaterialFileUrl } from "@/utils/materialFileUrl";

const SIZE_UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

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

function formatDuration(duration: number | undefined): string {
	if (duration == null || Number.isNaN(duration)) return "";
	// const hours = Math.floor(duration / 3600);
	const minutes = Math.floor((duration % 3600) / 60);
	const seconds = Math.floor(duration % 60);
	return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export interface VideoInfoProps {
	row: MaterialRow;
	fileHost: string;
	isShowReason?: boolean;
	/** Overlay rendered inside the cover image area (e.g. quality badge) */
	coverExtra?: React.ReactNode;
	children?: React.ReactNode;
}

export function VideoInfo({ row, fileHost, isShowReason = false, coverExtra, children }: VideoInfoProps) {
	const [playVisible, setPlayVisible] = useState(false);
	const coverUrl = buildMaterialFileUrl(fileHost, row.coverUrl);
	const objectUrl = buildMaterialFileUrl(fileHost, row.objectUrl);

	const isRevisionPending = row.status === "revision_pending_review";
	const displayName = isRevisionPending ? (row?.auditingInfo?.name ?? row.name) : row.name;
	const createTimeStr = row.createdTime ? dayjs(row.createdTime).format("YYYY-MM-DD HH:mm:ss") : "";
	const uploadDesc = `${row.createdUserName ?? ""} 于 ${createTimeStr} 上传`;
	const brandLogo = buildMaterialFileUrl(fileHost, row.brandLogoUrl);
	const carText = row.carModelInfo
		? [row.carModelInfo.brandName, row.carModelInfo.subBrandName, row.carModelInfo.seriesName, row.carModelInfo.carName]
				.filter(Boolean)
				.join("/") || "-"
		: "-";

	return (
		<div className="flex w-full items-start gap-3 overflow-hidden">
			<button
				type="button"
				className="relative h-[80px] w-20 shrink-0 cursor-pointer overflow-hidden rounded-md border-0 bg-transparent p-0"
				onClick={() => setPlayVisible(true)}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						setPlayVisible(true);
					}
				}}
				aria-label="播放视频"
			>
				<img src={coverUrl || ""} alt="" className="block h-full w-full object-cover" />
				<div
					className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
					style={{ backgroundColor: "rgb(0 0 0 / 60%)" }}
				>
					<Icon icon="solar:play-bold" className="text-xl" color="white" />
				</div>
			</button>

			<div className="flex min-w-0 flex-1 flex-col items-start gap-2.5 text-left text-xs text-muted-foreground">
				<div className="flex w-full items-center gap-1.5 overflow-hidden">
					{coverExtra}
					<Tooltip title={displayName} placement="top">
						<span
							className={cn(
								"min-w-0 flex-1 truncate text-[14px] leading-snug",
								// isRevisionPending && "text-[#ff7070]",
								!isRevisionPending && "text-foreground",
							)}
						>
							{displayName}
						</span>
					</Tooltip>
				</div>
				<span className="w-full truncate text-[12px] text-[#86909C]">{uploadDesc}</span>
				<div className="flex w-full items-center gap-1.5 overflow-hidden">
					<img src={brandLogo || defaultCarLogo} alt="" className="mr-1.5 h-3.5 w-auto shrink-0 object-contain" />
					<Tooltip title={carText} placement="top">
						<span className="min-w-0 flex-1 truncate text-[14px] text-[#4E5969]">{carText}</span>
					</Tooltip>
				</div>
				<div className="flex gap-2.5 text-[12px] text-[#86909C]">
					<span className="inline-flex items-center gap-1 leading-none [&_svg]:text-sm [&_svg]:opacity-80">
						<Icon icon="icon-park-outline:time" />
						{formatDuration(row.durationSec)}
					</span>
					<span className="inline-flex items-center gap-1 whitespace-nowrap leading-none [&_svg]:text-sm [&_svg]:opacity-80">
						<Icon icon="material-symbols:save-outline-rounded" />
						{formatSize(row.size)}
					</span>
					<span className="inline-flex items-center gap-1 leading-none [&_svg]:text-sm [&_svg]:opacity-80">
						<Icon icon="fluent:scan-camera-20-filled" />
						{row.resolution ?? ""}
					</span>
				</div>
				{row.reason != null && row.reason !== "" && isShowReason ? (
					<div className="w-full truncate text-[#f53f3f]">原因: {row.reason}</div>
				) : null}
				{children}
			</div>

			<VideoPlayModal open={playVisible} onClose={() => setPlayVisible(false)} url={objectUrl} title={displayName} />
		</div>
	);
}
