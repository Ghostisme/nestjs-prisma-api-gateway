export interface Request {
	brandCombination?: string;
	brandId: number;
	broadcastStyle?: string;
	endingAction?: string;
	endingActionDesc?: string;
	hasHotspot?: boolean;
	hookType?: string;
	hotspotDescription?: string;
	interviewCoreDimension?: string;
	modelId?: number;
	plotRhythm?: string;
	policyOffers?: PolicyOfferItem[];
	presentationForm?: string;
	presentationRole?: PresentationRoleItem[];
	purchaseScenarios?: string[];
	region?: string;
	sellingPointTags?: string[];
	seriesId?: number;
	shootingLocation?: string[];
	subBrandId: number;
	taskType?: TaskTypeItem[];
	videoDuration?: string;
	[property: string]: any;
}
export type FormattedScriptSaveRequest = Request & {
	brandId: number;
	subBrandId: number;
	seriesId: number;
};

export interface PolicyOfferItem {
	code?: string;
	description?: string;
	[property: string]: any;
}

export interface PresentationRoleItem {
	count?: number;
	role?: string;
	[property: string]: any;
}

export interface TaskTypeItem {
	factor?: number;
	type?: string;
	[property: string]: any;
}

const toNumber = (value: unknown): number | undefined => {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}
	if (typeof value === "string" && value.trim() !== "") {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : void 0;
	}
	return void 0;
};

const toStringValue = (value: unknown): string | undefined => {
	if (typeof value === "string") {
		const nextValue = value.trim();
		return nextValue ? nextValue : void 0;
	}
	return void 0;
};

const toBoolean = (value: unknown): boolean | undefined => {
	if (typeof value === "boolean") {
		return value;
	}
	if (value === 1 || value === "1" || value === "true") {
		return true;
	}
	if (value === 0 || value === "0" || value === "false") {
		return false;
	}
	return void 0;
};

const toStringArray = (value: unknown, maxLength?: number): string[] | undefined => {
	if (!Array.isArray(value)) {
		return void 0;
	}
	const nextValue = value.map((item) => toStringValue(item)).filter((item): item is string => Boolean(item));
	if (!nextValue.length) {
		return void 0;
	}
	return typeof maxLength === "number" ? nextValue.slice(0, maxLength) : nextValue;
};

const isDefined = <T>(value: T | undefined): value is T => value !== void 0;

const toPolicyOffers = (value: unknown): PolicyOfferItem[] | undefined => {
	if (!Array.isArray(value)) {
		return void 0;
	}
	const nextValue = value
		.map((item): PolicyOfferItem | undefined => {
			if (!item || typeof item !== "object") {
				return void 0;
			}
			const nextItem = item as Record<string, unknown>;
			const code = toStringValue(nextItem.code);
			const description = toStringValue(nextItem.description);
			if (!code && !description) {
				return void 0;
			}
			const nextPolicyOffer: PolicyOfferItem = {};
			if (code) {
				nextPolicyOffer.code = code;
			}
			if (description) {
				nextPolicyOffer.description = description;
			}
			return nextPolicyOffer;
		})
		.filter(isDefined);
	return nextValue.length ? nextValue : void 0;
};

const toPresentationRole = (value: unknown): PresentationRoleItem[] | undefined => {
	if (!Array.isArray(value)) {
		return void 0;
	}
	const nextValue = value
		.map((item): PresentationRoleItem | undefined => {
			if (!item || typeof item !== "object") {
				return void 0;
			}
			const nextItem = item as Record<string, unknown>;
			const count = toNumber(nextItem.count);
			const role = toStringValue(nextItem.role);
			if (count === void 0 && !role) {
				return void 0;
			}
			const nextRole: PresentationRoleItem = {};
			if (count !== void 0) {
				nextRole.count = count;
			}
			if (role) {
				nextRole.role = role;
			}
			return nextRole;
		})
		.filter(isDefined)
		.slice(0, 5);
	return nextValue.length ? nextValue : void 0;
};

const toTaskType = (value: unknown): TaskTypeItem[] | undefined => {
	if (!Array.isArray(value)) {
		return void 0;
	}
	const nextValue = value
		.map((item): TaskTypeItem | undefined => {
			if (!item || typeof item !== "object") {
				return void 0;
			}
			const nextItem = item as Record<string, unknown>;
			const factor = toNumber(nextItem.factor);
			const type = toStringValue(nextItem.type);
			if (factor === void 0 && !type) {
				return void 0;
			}
			const nextTaskType: TaskTypeItem = {};
			if (factor !== void 0) {
				nextTaskType.factor = factor;
			}
			if (type) {
				nextTaskType.type = type;
			}
			return nextTaskType;
		})
		.filter(isDefined);
	return nextValue.length ? nextValue : void 0;
};

const getBrandCombination = (
	brandCombination: unknown,
	subBrandId: number,
	seriesId: number,
	modelId?: number,
): string | undefined => {
	if (typeof brandCombination === "string") {
		const parts = brandCombination
			.split(",")
			.map((item) => item.trim())
			.filter(Boolean)
			.map((item) => toNumber(item))
			.filter((item): item is number => item !== void 0);
		if (parts.length >= 2) {
			return parts.slice(0, 3).join(",");
		}
	}
	const nextIds = [subBrandId, seriesId, modelId].filter((item): item is number => item !== void 0);
	return nextIds.length >= 2 ? nextIds.join(",") : void 0;
};

export const fmtScriptSaveRequest = (payload: Record<string, unknown>): FormattedScriptSaveRequest => {
	const brandId = toNumber(payload.brandId);
	const subBrandId = toNumber(payload.subBrandId);
	const seriesId = toNumber(payload.seriesId);
	if (brandId === void 0 || subBrandId === void 0 || seriesId === void 0) {
		throw new Error("品牌、子品牌或车系参数缺失");
	}
	const modelId = toNumber(payload.modelId);
	const hasHotspot = toBoolean(payload.hasHotspot);
	const nextPayload: FormattedScriptSaveRequest = {
		brandId,
		subBrandId,
		seriesId,
		brandCombination: getBrandCombination(payload.brandCombination, subBrandId, seriesId, modelId),
		modelId,
		broadcastStyle: toStringValue(payload.broadcastStyle),
		endingAction: toStringValue(payload.endingAction),
		endingActionDesc: toStringValue(payload.endingActionDesc),
		hasHotspot,
		hookType: toStringValue(payload.hookType),
		hotspotDescription: hasHotspot ? toStringValue(payload.hotspotDescription) : void 0,
		interviewCoreDimension: toStringValue(payload.interviewCoreDimension),
		plotRhythm: toStringValue(payload.plotRhythm),
		policyOffers: toPolicyOffers(payload.policyOffers),
		presentationForm: toStringValue(payload.presentationForm),
		presentationRole: toPresentationRole(payload.presentationRole),
		purchaseScenarios: toStringArray(payload.purchaseScenarios, 3),
		region: toStringValue(payload.region),
		sellingPointTags: toStringArray(payload.sellingPointTags, 20),
		shootingLocation: toStringArray(payload.shootingLocation, 5),
		taskType: toTaskType(payload.taskType),
		videoDuration: toStringValue(payload.videoDuration),
	};
	return Object.entries(nextPayload).reduce<FormattedScriptSaveRequest>((acc, [key, value]) => {
		if (value !== void 0) {
			acc[key] = value;
		}
		return acc;
	}, {} as FormattedScriptSaveRequest);
};
