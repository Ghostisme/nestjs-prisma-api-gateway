/**
 * 引入枚举
 * @description 操作类型配置
 */
export const optionsConfigEnum = {
	/** 编辑 */
	EDIT: "edit",
	/** 补充标签 */
	SUPPLEMENT: "supplement",
	/** 重新申请 */
	REAPPLY: "reapply",
	/** 修正 */
	CORRECT: "correct",
	/** 批量编辑 */
	BATCH_EDIT: "batchEdit",
	/** 批量补充标签 */
	BATCH_SUPPLEMENT: "batchSupplement",
} as const;

/**
 * 引入枚举
 * @description 素材质量配置
 */
export const MaterialQualityEnum = {
	/** 劣质素材 */
	INFERIOR: 1,
	/** 优质素材 */
	PREMIUM: 2,
} as const;

/**
 * 引入枚举
 * @description 素材质量显示文案
 */
export const MaterialQualityTextEnum = {
	/** 劣质素材 */
	[MaterialQualityEnum.INFERIOR]: "劣质",
	/** 优质素材 */
	[MaterialQualityEnum.PREMIUM]: "优质",
} as const;

/**
 * 引入枚举
 * @description 素材标记状态
 */
export const MaterialTypeEnum = {
	/** 未达标 */
	UNMARKED: "unmarked",
	/** 已达标 */
	MARKED: "marked",
} as const;

/**
 * 引入枚举
 * @description 素材标记状态显示文案
 */
export const MaterialTypeTextEnum = {
	/** 未达标 */
	[MaterialTypeEnum.UNMARKED]: "未达标",
	/** 已达标 */
	[MaterialTypeEnum.MARKED]: "已达标",
} as const;

export const statusOptions = [
	{
		label: "未申请审核",
		value: "pending_tagging",
	},
	{
		label: "审核中",
		value: "marking_review_in_progress",
	},
	{
		label: "未通过",
		value: "re_review_rejected",
	},
] as const;

/**
 * 引入枚举
 * @description 标签来源
 */
export const TagSourceEnum = {
	/** AI */
	AI: "AI",
	/** 手动 */
	MANUAL: "manual",
} as const;

/**
 * 引入枚举
 * @description 标签来源显示文案
 */
export const TagSourceTextEnum = {
	/** AI */
	[TagSourceEnum.AI]: "AI",
	/** 手动 */
	[TagSourceEnum.MANUAL]: "人工",
} as const;

/**
 * 引入枚举
 * @description AI标签状态
 */
export const AITagStatusEnum = {
	/** 成功 */
	SUCCESS: "success",
	/** 失败 */
	FAILED: "failed",
	/** 进行中 */
	PENDING: "pending",
} as const;

/**
 * 引入枚举
 * @description AI标签状态显示文案
 */
export const AITagStatusTextEnum = {
	/** 成功 */
	[AITagStatusEnum.SUCCESS]: "成功",
	/** 失败 */
	[AITagStatusEnum.FAILED]: "失败",
	/** 进行中 */
	[AITagStatusEnum.PENDING]: "进行中",
} as const;

type UpdatedStatusConfig = string | { default: string; ai_failed?: string; [k: string]: string | undefined };

export const updatedStatus: Record<string, UpdatedStatusConfig> = {
	pending_tagging: {
		default: "素材待补充标签",
		ai_failed: "AI打标失败",
	},
	marking_review_in_progress: {
		default: "打标审核中",
		[TagSourceEnum.AI]: "打标审核中 · AI",
		[TagSourceEnum.MANUAL]: "打标审核中 · 人工",
	},
	re_review_rejected: {
		default: "打标审核不通过",
		[TagSourceEnum.AI]: "打标审核不通过 · AI",
		[TagSourceEnum.MANUAL]: "打标审核不通过 · 人工",
	},
	approved: {
		default: "素材审核已审核",
		[TagSourceEnum.AI]: "素材审核已审核 · AI",
		[TagSourceEnum.MANUAL]: "素材审核已审核 · 人工",
	},
	revision_pending_review: "标签修正审核中",
	revision_rejected: "标签修正不通过",
	deleted: "已删除",
};

export const getStatusText = (status: string, tagSource?: string, aiTagStatus?: string): string => {
	const statusConfig = updatedStatus[status];

	if (typeof statusConfig === "object" && statusConfig !== null) {
		if (
			status === "pending_tagging" &&
			tagSource === TagSourceEnum.AI &&
			aiTagStatus === AITagStatusEnum.FAILED &&
			statusConfig.ai_failed
		) {
			return statusConfig.ai_failed;
		}

		if (tagSource && statusConfig[tagSource]) {
			return statusConfig[tagSource] || "";
		}

		return statusConfig.default || "";
	}

	return statusConfig || "";
};

export interface DisplayStatus {
	text: string;
	color: string;
}

export const getDisplayStatus = (status: string, tagSource?: string, aiTagStatus?: string): DisplayStatus => {
	const statusText = getStatusText(status, tagSource, aiTagStatus);
	let prefix = "";
	let color = "#909399";

	if (["marking_review_in_progress", "re_review_rejected"].includes(status)) {
		prefix = "素材审核/";
		if (status === "marking_review_in_progress") color = "#FF7D00";
		if (status === "re_review_rejected") color = "#F53F3F";
	} else if (["revision_pending_review", "revision_rejected"].includes(status)) {
		prefix = "素材修正/";
		if (status === "revision_pending_review") color = "#FF7D00";
		if (status === "revision_rejected") color = "#F53F3F";
	} else {
		if (status === "pending_tagging") color = "#E6A23C";
		if (status === "approved") color = "#67C23A";
		if (status === "deleted") color = "#909399";
	}

	return { text: prefix + statusText, color };
};
