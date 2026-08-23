/** 已打标素材卡片视图：复用表格的 data/total/分页，仅展示形态为卡片，不触发接口重载 */

import type { MenuProps } from "antd";
import { Checkbox, Dropdown, Tooltip } from "antd";
import dayjs from "dayjs";
import type { Key } from "react";
import { memo, useCallback, useRef, useState } from "react";
import type { MaterialRow } from "@/api/material/types";
import defaultCarLogo from "@/assets/material/carLog.png";
import { Icon } from "@/components/icon";
import { MaterialVideoPreviewCard } from "@/components/MaterialVideoPreviewCard";
import type { ContentSlotContext } from "@/components/table";
import { VideoPlayModal } from "@/components/VideoPlayModal";
import { Button } from "@/ui/button";
import { cn } from "@/utils";
import { buildMaterialFileUrl } from "@/utils/materialFileUrl";

const QUALITY_PREMIUM = 2;
const QUALITY_INFERIOR = 1;

export type MaterialCardViewProps = ContentSlotContext<MaterialRow> & {
	fileHost?: string;
	onCorrect?: (record: MaterialRow) => void;
	onDownload?: (record: MaterialRow) => void;
	onDelete?: (record: MaterialRow, onSuccess?: () => void) => void;
	onSupplement?: (record: MaterialRow) => void;
	onReapply?: (record: MaterialRow) => void;
	onAiRetry?: (record: MaterialRow) => void;
	correctText?: string;
};

type MaterialCardProps = {
	record: MaterialRow;
	fileHost: string;
	isSelected: boolean;
	correctText: string;
	onCorrect?: (record: MaterialRow) => void;
	onDownload?: (record: MaterialRow) => void;
	onDelete?: (record: MaterialRow, onSuccess?: () => void) => void;
	onSelect?: (id: Key, checked: boolean, record: MaterialRow) => void;
	onSupplement?: (record: MaterialRow) => void;
	onReapply?: (record: MaterialRow) => void;
	onAiRetry?: (record: MaterialRow) => void;
};

const MaterialCard = memo(function MaterialCard({
	record,
	fileHost,
	isSelected,
	correctText,
	onCorrect,
	onDownload,
	onDelete,
	onSelect,
	onSupplement,
	onReapply,
	onAiRetry,
}: MaterialCardProps) {
	// playState lives inside each card — toggling playback on one card no longer
	// causes all sibling cards to re-render.
	const [playState, setPlayState] = useState<{ url: string; title: string } | null>(null);

	const brandLogo = buildMaterialFileUrl(fileHost, record.brandLogoUrl);
	const carText = record.carModelInfo
		? [record.carModelInfo.brandName, record.carModelInfo.seriesName, record.carModelInfo.carName]
				.filter(Boolean)
				.join(" ") || "-"
		: "-";
	const createTimeStr = record.createdTime ? dayjs(record.createdTime).format("YYYY-MM-DD HH:mm:ss") : "-";
	const uploadDesc = `${record.createdUserName ?? ""} 于 ${createTimeStr} 上传`;
	const bodyClass = cn(
		"flex flex-1 flex-col gap-1 rounded-b-[20px] px-4 pb-3 pt-3 text-xs font-normal",
		record.quality === QUALITY_PREMIUM && "bg-linear-to-t from-[#DEE8FF] to-[#FFFFFF]",
		record.quality === QUALITY_INFERIOR && "bg-linear-to-t from-[#FFC7C7] to-[#FFFFFF]",
		record.quality !== QUALITY_PREMIUM && record.quality !== QUALITY_INFERIOR && "bg-card",
	);

	const status = record.status ?? "";

	const isReviewing = status === "marking_review_in_progress";
	const aiTagPending = record.aiTagStatus === "pending";
	const aiTagFailed = record.aiTagStatus === "failed";
	const canSupplement = status === "pending_tagging" && !aiTagPending;
	const canReapply = status === "re_review_rejected";

	// unmark模式（有补充/重申/重试handler）用 !isReviewing；mark模式用 approved/revision_rejected
	const showCorrect =
		onSupplement || onReapply || onAiRetry ? !isReviewing : status === "approved" || status === "revision_rejected";

	const menuItems: MenuProps["items"] = [
		...(showCorrect && onCorrect ? [{ key: "correct", label: correctText, onClick: () => onCorrect(record) }] : []),
		...(onDownload ? [{ key: "download", label: "下载", onClick: () => onDownload(record) }] : []),
		...(!aiTagPending && onDelete
			? [{ key: "delete", label: "删除", danger: true, onClick: () => onDelete(record) }]
			: []),
		...(canSupplement && onSupplement
			? [{ key: "supplement", label: "补充标签", onClick: () => onSupplement(record) }]
			: []),
		...(canReapply && onReapply ? [{ key: "reapply", label: "重新申请", onClick: () => onReapply(record) }] : []),
		...(aiTagFailed && !isReviewing && onAiRetry
			? [{ key: "aiRetry", label: "AI重试", onClick: () => onAiRetry(record) }]
			: []),
	];

	const wrapperClass = cn(
		"flex flex-col rounded-[20px] bg-background w-full min-w-0 overflow-hidden border",
		isSelected ? "border-2 border-[#165DFF]" : "border border-[#E5E5E5]",
	);

	return (
		<div className={wrapperClass}>
			<MaterialVideoPreviewCard
				row={record}
				fileHost={fileHost}
				width={263}
				height={148}
				borderRadius={0}
				showDownload={!!onDownload}
				checkboxNode={
					onSelect ? (
						<Checkbox
							checked={isSelected}
							onChange={(e) => {
								e.stopPropagation();
								onSelect(record.id, e.target.checked, record);
							}}
						/>
					) : null
				}
				onPlay={({ url, title }) => setPlayState({ url, title })}
				onDownload={onDownload ? () => onDownload(record) : undefined}
			/>

			{/* card-body */}
			<div className={bodyClass}>
				<div className="min-w-0 w-full flex items-center justify-between">
					{record.quality === QUALITY_PREMIUM && (
						<span
							className="inline-flex shrink-0 items-center gap-0.5 rounded-full px-1 py-0.5 text-xs font-medium text-white"
							style={{ background: "#165DFF" }}
						>
							<Icon icon="noto:red-heart" className="size-3" />
							优质
						</span>
					)}
					{record.quality === QUALITY_INFERIOR && (
						<span
							className="inline-flex shrink-0 items-center gap-0.5 rounded-full px-1 py-0.5 text-xs font-medium text-white"
							style={{ background: "#F53F3F" }}
						>
							<Icon icon="noto:warning" className="size-3" />
							劣质
						</span>
					)}
					{record.status === "marking_review_in_progress" && (
						<span
							className="inline-flex shrink-0 items-center gap-0.5 rounded-full px-1 py-0.5 text-xs font-medium"
							style={{ color: "#FF7D00", backgroundColor: "rgba(255, 125, 0, 0.2)" }}
						>
							审核中
						</span>
					)}
					{record.status === "revision_pending_review" && (
						<span
							className="inline-flex shrink-0 items-center gap-0.5 rounded-full px-1 py-0.5 text-xs font-medium"
							style={{ color: "#FF7D00", backgroundColor: "rgba(255, 125, 0, 0.2)" }}
						>
							标签修正审核中
						</span>
					)}
					{record.quality !== QUALITY_PREMIUM && record.quality !== QUALITY_INFERIOR && null}
					<Tooltip title={record.name} placement="top">
						<div className="flex min-w-0 items-center">
							<span
								className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[14px]"
								style={{ marginLeft: 8 }}
							>
								{record.name}
							</span>
						</div>
					</Tooltip>

					<div>
						{menuItems.length > 0 && (
							<Dropdown menu={{ items: menuItems }} trigger={["click"]} placement="bottomRight">
								<Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={(e) => e.stopPropagation()}>
									<Icon icon="solar:menu-dots-bold" className="size-4 text-[#4E5969]" />
								</Button>
							</Dropdown>
						)}
					</div>
				</div>
				<div className="text-[12px] text-[#86909C]">{uploadDesc}</div>
				<div className="flex min-w-0 items-center overflow-hidden">
					<img src={brandLogo || defaultCarLogo} alt="" className="mr-1.5 shrink-0" style={{ width: 25, height: 14 }} />
					<Tooltip title={carText} placement="top">
						<span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[14px] text-[#4E5969]">
							{carText}
						</span>
					</Tooltip>
				</div>
				<div className="flex items-center gap-0.5">
					<Icon icon="solar:camera-outline" className="size-3.5 shrink-0" />
					<span className="text-[14px] text-[#4E5969]">{record.photographer ?? "-"}</span>
				</div>
			</div>

			<VideoPlayModal
				open={playState !== null}
				onClose={() => setPlayState(null)}
				url={playState?.url ?? ""}
				title={playState?.title ?? "视频预览"}
			/>
		</div>
	);
});

export function MaterialCardView({
	data,
	fileHost = "",
	selectedRowKeys = [],
	selectedRows = [],
	onSelectionChange,
	onCorrect,
	onDownload,
	onDelete,
	onSupplement,
	onReapply,
	onAiRetry,
	correctText = "纠错",
}: MaterialCardViewProps) {
	// Refs keep the latest selection state without destabilising handleCardSelect
	const selectedRowKeysRef = useRef(selectedRowKeys);
	const selectedRowsRef = useRef(selectedRows);
	selectedRowKeysRef.current = selectedRowKeys;
	selectedRowsRef.current = selectedRows;

	// Stable callback: deps only on onSelectionChange (parent-provided, itself stable)
	const handleCardSelect = useCallback(
		(id: Key, checked: boolean, record: MaterialRow) => {
			if (!onSelectionChange) return;
			if (checked) {
				onSelectionChange([...selectedRowKeysRef.current, id], [...selectedRowsRef.current, record]);
			} else {
				onSelectionChange(
					selectedRowKeysRef.current.filter((k) => k !== id),
					selectedRowsRef.current.filter((r) => r.id !== id),
				);
			}
		},
		[onSelectionChange],
	);

	if (data.length === 0) {
		return (
			<div className="flex min-h-80 items-center justify-center rounded-[20px] border border-dashed text-muted-foreground">
				暂无数据
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 justify-start gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[repeat(auto-fill,minmax(263px,263px))]">
			{data.map((record) => (
				<MaterialCard
					key={String(record.id)}
					record={record}
					fileHost={fileHost}
					// Pass a boolean so sibling cards are not re-rendered when selection changes
					isSelected={selectedRowKeys.includes(record.id)}
					correctText={correctText}
					onCorrect={onCorrect}
					onDownload={onDownload}
					onDelete={onDelete}
					onSelect={onSelectionChange ? handleCardSelect : undefined}
					onSupplement={onSupplement}
					onReapply={onReapply}
					onAiRetry={onAiRetry}
				/>
			))}
		</div>
	);
}
