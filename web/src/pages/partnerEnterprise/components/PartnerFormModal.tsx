import { useQueries, useQuery } from "@tanstack/react-query";
import { Button, Checkbox, Form, Input, Modal, Radio, Spin, Tabs, Tree, message } from "antd";
import type { DataNode, TreeProps } from "antd/es/tree";
import { type JSX, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	type AiCapabilityVO,
	createPartnerEnterprise,
	getPartnerAvailableMenuList,
	getPartnerEnterpriseDetail,
	type MenuSimpleTreeVO,
	type TenantBusinessMenuDTO,
	type TenantDetailInfoVO,
	type TenantSaveRequest,
	type TenantUpdateRequest,
	updatePartnerEnterprise,
} from "@/api/partnerEnterpriseManagement";
import { BrandSelect } from "@/components/brandSelect";
import Icon from "@/components/icon/icon";
import {
	PARTNER_ENTERPRISE_AI_FUNCTION_KEY_SET,
	PARTNER_ENTERPRISE_LEGACY_AI_FUNCTION_CODE_MAP,
	PARTNER_ENTERPRISE_PRODUCT_BUSINESS_CODE_MAP,
	PARTNER_ENTERPRISE_PRODUCT_FUNCTION_KEY_SET,
	PARTNER_ENTERPRISE_PRODUCT_FUNCTION_OPTIONS,
	PARTNER_ENTERPRISE_STATUS_OPTIONS,
	type PartnerEnterpriseProductFunction,
} from "@/pages/partnerEnterprise/constants";
import { getApiErrorMessage } from "@/utils/request-error";
import type { PartnerEnterpriseFormData } from "../types";

const PHONE_REG = /^1[3-9]\d{9}$/;
const DEFAULT_PRODUCT_FUNCTION = "talent";

type ProductBackendModuleSelections = Partial<Record<PartnerEnterpriseProductFunction, number[]>>;
type PartnerMenuTreeNode = DataNode & {
	key: string;
	children?: PartnerMenuTreeNode[];
};

const sortNumberValues = (values: number[]): number[] => [...values].sort((left, right) => left - right);
const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const toFiniteNumber = (value: unknown): number | undefined => {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}

	if (typeof value === "string" && value.trim() !== "") {
		const parsedValue = Number(value);
		return Number.isFinite(parsedValue) ? parsedValue : undefined;
	}

	return undefined;
};
const normalizeOptionalString = (value: unknown): string | undefined => {
	if (typeof value !== "string") {
		return undefined;
	}

	const trimmedValue = value.trim();
	return trimmedValue || undefined;
};

const normalizeAiFunctionCode = (value: unknown): number | undefined => {
	const aiCode = toFiniteNumber(value);
	if (aiCode !== undefined) {
		return aiCode;
	}

	return undefined;
};

const normalizeAiFunctionCodes = (value: unknown): number[] => {
	const rawValues = Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
	const normalizedCodes = new Set<number>();

	for (const rawValue of rawValues) {
		const normalizedCode = normalizeAiFunctionCode(rawValue);
		if (normalizedCode !== undefined) {
			normalizedCodes.add(normalizedCode);
		}
	}

	return sortNumberValues([...normalizedCodes]);
};

const isLegacyAiFunctionCode = (menuCode: string | undefined): boolean =>
	typeof menuCode === "string" && typeof PARTNER_ENTERPRISE_LEGACY_AI_FUNCTION_CODE_MAP[menuCode] === "number";

const isAiFunctionNode = (node: MenuSimpleTreeVO): boolean => {
	const menuId = toFiniteNumber(node.menuId);
	return (
		(menuId !== undefined && PARTNER_ENTERPRISE_AI_FUNCTION_KEY_SET.has(menuId)) ||
		isLegacyAiFunctionCode(node.menuCode)
	);
};

const areNumberArraysEqual = (left: number[], right: number[]): boolean => {
	const sortedLeft = sortNumberValues(left);
	const sortedRight = sortNumberValues(right);

	if (sortedLeft.length !== sortedRight.length) {
		return false;
	}

	return sortedLeft.every((value, index) => value === sortedRight[index]);
};

const areProductSelectionsEqual = (
	left: ProductBackendModuleSelections,
	right: ProductBackendModuleSelections,
): boolean => {
	const leftKeys = Object.keys(left).sort();
	const rightKeys = Object.keys(right).sort();

	if (leftKeys.length !== rightKeys.length || leftKeys.some((value, index) => value !== rightKeys[index])) {
		return false;
	}

	return leftKeys.every((key) => {
		const productKey = key as PartnerEnterpriseProductFunction;
		return areNumberArraysEqual(left[productKey] ?? [], right[productKey] ?? []);
	});
};

const collectSelectedFunctionCodes = (functions: MenuSimpleTreeVO[] | undefined): string[] => {
	if (!functions?.length) {
		return [];
	}

	const selectedCodes = new Set<string>();

	const traverseMenuTree = (nodes: MenuSimpleTreeVO[]) => {
		for (const node of nodes) {
			if (node.hasPermission === 1 && typeof node.menuCode === "string" && node.menuCode) {
				selectedCodes.add(node.menuCode);
			}

			if (node.children?.length) {
				traverseMenuTree(node.children);
			}
		}
	};

	traverseMenuTree(functions);

	return [...selectedCodes];
};

const collectCheckedPermissionCodes = (functions: MenuSimpleTreeVO[] | undefined): number[] => {
	if (!functions?.length) {
		return [];
	}

	const selectedPermissionCodes = new Set<number>();

	const traverseMenuTree = (nodes: MenuSimpleTreeVO[]) => {
		for (const node of nodes) {
			const permissionCode = toFiniteNumber(node.permissionCode);
			if (node.hasPermission === 1 && permissionCode !== undefined) {
				selectedPermissionCodes.add(permissionCode);
			}

			if (node.children?.length) {
				traverseMenuTree(node.children);
			}
		}
	};

	traverseMenuTree(functions);

	return [...selectedPermissionCodes];
};

const readDetailBusinessList = (detail: TenantDetailInfoVO): PartnerEnterpriseProductFunction[] => {
	const rawBusinessList = (detail as { businessList?: unknown }).businessList;
	if (!Array.isArray(rawBusinessList)) {
		return [];
	}

	return rawBusinessList.filter(
		(productFunction): productFunction is PartnerEnterpriseProductFunction =>
			typeof productFunction === "string" && PARTNER_ENTERPRISE_PRODUCT_FUNCTION_KEY_SET.has(productFunction),
	);
};

const readDetailAiCodeList = (detail: TenantDetailInfoVO): number[] => {
	const rawAiCodeList = (detail as { aiCodeList?: unknown }).aiCodeList;
	return normalizeAiFunctionCodes(rawAiCodeList);
};

const collectSelectedAiCapabilityCodes = (aiInfoList: AiCapabilityVO[] | undefined): number[] => {
	if (!aiInfoList?.length) {
		return [];
	}

	const selectedAiCodes = new Set<number>();

	for (const item of aiInfoList) {
		if (item.selected !== 1) {
			continue;
		}

		const normalizedCode = normalizeAiFunctionCode(item.aiCode);
		if (normalizedCode !== undefined) {
			selectedAiCodes.add(normalizedCode);
		}
	}

	return sortNumberValues([...selectedAiCodes]);
};

const collectBackendModulesByProduct = (functions: MenuSimpleTreeVO[] | undefined): ProductBackendModuleSelections => {
	if (!functions?.length) {
		return {};
	}

	const selections: ProductBackendModuleSelections = {};

	const traverseMenuTree = (nodes: MenuSimpleTreeVO[], currentProduct?: PartnerEnterpriseProductFunction): void => {
		for (const node of nodes) {
			const nextProduct =
				typeof node.menuCode === "string" && PARTNER_ENTERPRISE_PRODUCT_FUNCTION_KEY_SET.has(node.menuCode)
					? (node.menuCode as PartnerEnterpriseProductFunction)
					: currentProduct;

			if (nextProduct && node.hasPermission === 1 && isFiniteNumber(node.permissionCode) && !isAiFunctionNode(node)) {
				const currentSelections = selections[nextProduct] ?? [];
				if (!currentSelections.includes(node.permissionCode)) {
					selections[nextProduct] = [...currentSelections, node.permissionCode];
				}
			}

			if (node.children?.length) {
				traverseMenuTree(node.children, nextProduct);
			}
		}
	};

	traverseMenuTree(functions);

	return selections;
};

const mergeBackendModules = (selections: ProductBackendModuleSelections, productFunctions: string[]): number[] => {
	const mergedSelections = new Set<number>();

	for (const productFunction of productFunctions) {
		const modules = selections[productFunction as PartnerEnterpriseProductFunction] ?? [];
		for (const moduleKey of modules) {
			mergedSelections.add(moduleKey);
		}
	}

	return [...mergedSelections];
};

const getProductFunctionLabel = (productFunction: PartnerEnterpriseProductFunction): string =>
	PARTNER_ENTERPRISE_PRODUCT_FUNCTION_OPTIONS.find((item) => item.value === productFunction)?.label ?? productFunction;

const mapPartnerDetailToFormValues = (
	detail: TenantDetailInfoVO,
): PartnerEnterpriseFormData & { backendModulesByProduct: ProductBackendModuleSelections } => {
	const selectedFunctionCodes = collectSelectedFunctionCodes(detail.functions);
	const inferredBackendModulesByProduct = collectBackendModulesByProduct(detail.functions);
	const detailAiCodeList = readDetailAiCodeList(detail);
	const explicitBusinessList = readDetailBusinessList(detail);
	const inferredFunctionCodes = selectedFunctionCodes.filter((code): code is PartnerEnterpriseProductFunction =>
		PARTNER_ENTERPRISE_PRODUCT_FUNCTION_KEY_SET.has(code),
	);
	const inferredBusinessList = Array.from(
		new Set<PartnerEnterpriseProductFunction>([
			...inferredFunctionCodes,
			...(Object.keys(inferredBackendModulesByProduct) as PartnerEnterpriseProductFunction[]),
			...(detailAiCodeList.length > 0 ? ["ai" as const] : []),
		]),
	);
	const productFunctions = explicitBusinessList.length > 0 ? explicitBusinessList : inferredBusinessList;

	return {
		brandId: detail.brandId,
		name: detail.name ?? "",
		principal: detail.principal ?? "",
		phone: detail.phone ?? "",
		businessList: productFunctions,
		backendModules: [],
		backendModulesByProduct: {},
		aiCodeList: detailAiCodeList,
		status: detail.status ?? 0,
	};
};

const buildTenantBusinessFunctions = (
	productFunctions: PartnerEnterpriseProductFunction[],
	selectedModulesByProduct: ProductBackendModuleSelections,
	selectedAiFunctions: number[],
): TenantBusinessMenuDTO[] =>
	productFunctions.map((productFunction) => {
		const menuCodeList = sortNumberValues(selectedModulesByProduct[productFunction] ?? []);

		const businessFunction: TenantBusinessMenuDTO = {
			businessCode: PARTNER_ENTERPRISE_PRODUCT_BUSINESS_CODE_MAP[productFunction],
			menuCodeList,
		};

		if (productFunction === "ai" && selectedAiFunctions.length > 0) {
			businessFunction.aiCodeList = sortNumberValues(selectedAiFunctions);
		}

		return businessFunction;
	});

const mapFormValuesToSaveRequest = (
	values: PartnerEnterpriseFormData,
	selectedModulesByProduct: ProductBackendModuleSelections,
): TenantSaveRequest => {
	const productFunctions = values.businessList.filter((productFunction: string) =>
		PARTNER_ENTERPRISE_PRODUCT_FUNCTION_KEY_SET.has(productFunction),
	) as PartnerEnterpriseProductFunction[];
	const selectedAiFunctions = productFunctions.includes("ai") ? normalizeAiFunctionCodes(values.aiCodeList) : [];
	const businessList = productFunctions.map(
		(productFunction) => PARTNER_ENTERPRISE_PRODUCT_BUSINESS_CODE_MAP[productFunction],
	);

	return {
		brandId: values.brandId as number,
		businessList,
		functions: buildTenantBusinessFunctions(productFunctions, selectedModulesByProduct, selectedAiFunctions),
		name: values.name.trim(),
		phone: normalizeOptionalString(values.phone),
		principal: normalizeOptionalString(values.principal),
		status: values.status,
	};
};

const mapFormValuesToUpdateRequest = (
	partnerId: number,
	values: PartnerEnterpriseFormData,
	selectedModulesByProduct: ProductBackendModuleSelections,
): TenantUpdateRequest => {
	const saveRequest = mapFormValuesToSaveRequest(values, selectedModulesByProduct);

	return {
		...saveRequest,
		functions: saveRequest.functions ?? [],
		id: partnerId,
	};
};

type ModalMode = "create" | "edit" | "view";

interface PartnerFormModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
	mode?: ModalMode;
	partnerId?: number | null;
}

const MODE_TITLE: Record<ModalMode, string> = {
	create: "Add Partner Enterprise",
	edit: "Edit Partner Enterprise",
	view: "View Partner Enterprise",
};

export default function PartnerFormModal({
	open,
	onOpenChange,
	onSuccess,
	mode = "create",
	partnerId,
}: PartnerFormModalProps): JSX.Element {
	const [form] = Form.useForm<PartnerEnterpriseFormData>();
	const [loading, setLoading] = useState(false);
	const [detailLoading, setDetailLoading] = useState(false);
	// 编辑/查看态需要等详情、菜单、AI 功能都完成初始化后再展示完整表单，
	// 避免弹窗先渲染出“半回填”状态，造成内容跳动或误操作。
	const [initializingLoading, setInitializingLoading] = useState(false);
	const hasInitializedAiSelections = useRef(false);
	const initializedMenuProductsRef = useRef<Set<PartnerEnterpriseProductFunction>>(new Set());
	const [selectedModulesByProduct, setSelectedModulesByProduct] = useState<ProductBackendModuleSelections>({});
	const [activeProductFunction, setActiveProductFunction] =
		useState<PartnerEnterpriseProductFunction>(DEFAULT_PRODUCT_FUNCTION);
	const isEditMode = mode === "edit";
	const isViewMode = mode === "view";
	const isDetailMode = isEditMode || isViewMode;
	const shouldDisableImmutableFields = isEditMode || isViewMode || detailLoading;
	const selectedBusinessList = Form.useWatch("businessList", form) ?? [];
	const hasAiProductSelected = selectedBusinessList.includes("ai");
	const resetModalState = useCallback(() => {
		form.resetFields();
		setLoading(false);
		setDetailLoading(false);
		setInitializingLoading(false);
		setSelectedModulesByProduct({});
		setActiveProductFunction(DEFAULT_PRODUCT_FUNCTION);
		hasInitializedAiSelections.current = false;
		initializedMenuProductsRef.current.clear();
	}, [form]);
	const handleCloseModal = useCallback(() => {
		onOpenChange(false);
	}, [onOpenChange]);
	const handleAfterOpenChange = useCallback(
		(nextOpen: boolean) => {
			if (!nextOpen) {
				resetModalState();
			}
		},
		[resetModalState],
	);
	const filteredProductFunctions = useMemo(
		() =>
			selectedBusinessList.filter((productFunction: string) =>
				PARTNER_ENTERPRISE_PRODUCT_FUNCTION_KEY_SET.has(productFunction),
			) as PartnerEnterpriseProductFunction[],
		[selectedBusinessList],
	);
	const availableMenuQueryResults = useQueries({
		queries: filteredProductFunctions.map((productFunction) => ({
			queryKey: ["partner-available-menu-list", productFunction, partnerId],
			queryFn: () =>
				getPartnerAvailableMenuList(
					mode === "create"
						? {
								businessCode: PARTNER_ENTERPRISE_PRODUCT_BUSINESS_CODE_MAP[productFunction],
							}
						: {
								businessCode: PARTNER_ENTERPRISE_PRODUCT_BUSINESS_CODE_MAP[productFunction],
								tenantId: partnerId ?? undefined,
							},
				),
			enabled: open,
		})),
	});
	const activeProductQueryResult = filteredProductFunctions.includes(activeProductFunction)
		? availableMenuQueryResults[filteredProductFunctions.indexOf(activeProductFunction)]
		: undefined;
	const availableMenuTree = activeProductQueryResult?.data?.menuList ?? [];
	const availableMenuTreeLoading = activeProductQueryResult?.isPending ?? false;
	const availableMenuTreeError = activeProductQueryResult?.isError ?? false;

	const {
		data: availableAiCapabilityData,
		isFetching: availableAiCapabilityFetching,
		isPending: availableAiCapabilityLoading,
		isError: availableAiCapabilityError,
	} = useQuery({
		queryKey: ["partner-available-ai-capability-list", partnerId],
		queryFn: () =>
			getPartnerAvailableMenuList(
				mode === "create"
					? {
							businessCode: PARTNER_ENTERPRISE_PRODUCT_BUSINESS_CODE_MAP.ai,
						}
					: {
							businessCode: PARTNER_ENTERPRISE_PRODUCT_BUSINESS_CODE_MAP.ai,
							tenantId: partnerId ?? undefined,
						},
			),
		enabled: open && hasAiProductSelected,
	});

	const aiFunctionOptions = useMemo(() => {
		const optionsByValue = new Map<number, { label: string; value: number }>();

		for (const item of availableAiCapabilityData?.aiInfoList ?? []) {
			const aiCode = toFiniteNumber(item.aiCode);
			if (aiCode === undefined) {
				continue;
			}

			const aiName = typeof item.name === "string" ? item.name.trim() : "";
			if (!aiName) {
				continue;
			}

			optionsByValue.set(aiCode, {
				label: aiName,
				value: aiCode,
			});
		}

		return [...optionsByValue.values()];
	}, [availableAiCapabilityData]);

	useEffect(() => {
		if (!open) {
			return;
		}

		setInitializingLoading(isDetailMode);
		hasInitializedAiSelections.current = false;

		if (isDetailMode && partnerId) {
			let isMounted = true;

			const loadPartnerDetail = async (): Promise<void> => {
				try {
					setDetailLoading(true);
					const detail = await getPartnerEnterpriseDetail(partnerId);
					if (!isMounted) {
						return;
					}

					const formValues = mapPartnerDetailToFormValues(detail);
					form.setFieldsValue(formValues);
					if (formValues.businessList.length > 0) {
						setActiveProductFunction(formValues.businessList[0] as PartnerEnterpriseProductFunction);
					}
				} catch (error) {
					if (isMounted) {
						message.error(getApiErrorMessage(error, "Failed to load partner enterprise details"));
					}
				} finally {
					if (isMounted) {
						setDetailLoading(false);
					}
				}
			};

			void loadPartnerDetail();

			return () => {
				isMounted = false;
			};
		} else {
			setSelectedModulesByProduct({});
			setActiveProductFunction(DEFAULT_PRODUCT_FUNCTION);
			form.setFieldsValue({
				businessList: [DEFAULT_PRODUCT_FUNCTION],
				backendModules: [],
				aiCodeList: [],
				status: 0,
			});
		}
	}, [open, form, isDetailMode, partnerId]);

	useEffect(() => {
		if (!open) {
			return;
		}

		if (!hasAiProductSelected) {
			hasInitializedAiSelections.current = false;
			const currentAiCodeList = form.getFieldValue("aiCodeList") ?? [];
			if (!areNumberArraysEqual(currentAiCodeList, [])) {
				form.setFieldValue("aiCodeList", []);
			}
			return;
		}

		// 编辑/查看态下，查询可能会先返回缓存数据再刷新当前租户数据。
		// 等待本次请求完成后再初始化，避免被旧缓存提前写入导致回显不准。
		if (availableAiCapabilityLoading || availableAiCapabilityFetching || hasInitializedAiSelections.current) {
			return;
		}

		if (mode === "edit" || mode === "view") {
			const selectedAiCodeList = collectSelectedAiCapabilityCodes(availableAiCapabilityData?.aiInfoList);
			const currentAiCodeList = form.getFieldValue("aiCodeList") ?? [];
			if (!areNumberArraysEqual(currentAiCodeList, selectedAiCodeList)) {
				form.setFieldValue("aiCodeList", selectedAiCodeList);
			}
		}

		hasInitializedAiSelections.current = true;
	}, [
		availableAiCapabilityData,
		availableAiCapabilityFetching,
		availableAiCapabilityLoading,
		form,
		hasAiProductSelected,
		mode,
		open,
	]);

	useEffect(() => {
		const initializedMenuProducts = initializedMenuProductsRef.current;
		for (const productFunction of [...initializedMenuProducts]) {
			if (!filteredProductFunctions.includes(productFunction)) {
				initializedMenuProducts.delete(productFunction);
			}
		}
	}, [filteredProductFunctions]);

	useEffect(() => {
		if (filteredProductFunctions.length === 0) {
			setSelectedModulesByProduct((previousSelections) =>
				Object.keys(previousSelections).length === 0 ? previousSelections : {},
			);
			const currentBackendModules = form.getFieldValue("backendModules") ?? [];
			if (!areNumberArraysEqual(currentBackendModules, [])) {
				form.setFieldValue("backendModules", []);
			}
			if (activeProductFunction !== DEFAULT_PRODUCT_FUNCTION) {
				setActiveProductFunction(DEFAULT_PRODUCT_FUNCTION);
			}
			return;
		}

		setSelectedModulesByProduct((previousSelections) => {
			const nextSelections: ProductBackendModuleSelections = {};
			for (const productFunction of filteredProductFunctions) {
				nextSelections[productFunction] = previousSelections[productFunction] ?? [];
			}
			const nextBackendModules = mergeBackendModules(nextSelections, filteredProductFunctions);
			const currentBackendModules = form.getFieldValue("backendModules") ?? [];

			if (!areNumberArraysEqual(currentBackendModules, nextBackendModules)) {
				form.setFieldValue("backendModules", nextBackendModules);
			}

			return areProductSelectionsEqual(previousSelections, nextSelections) ? previousSelections : nextSelections;
		});

		if (!filteredProductFunctions.includes(activeProductFunction)) {
			setActiveProductFunction(filteredProductFunctions[0]);
		}
	}, [activeProductFunction, filteredProductFunctions, form]);

	useEffect(() => {
		if (!open) {
			return;
		}

		if (mode !== "edit" && mode !== "view") {
			return;
		}

		setSelectedModulesByProduct((previousSelections) => {
			const nextSelections = { ...previousSelections };
			let hasInitializedSelection = false;

			filteredProductFunctions.forEach((productFunction, index) => {
				const queryResult = availableMenuQueryResults[index];
				if (
					initializedMenuProductsRef.current.has(productFunction) ||
					!queryResult ||
					queryResult.isPending ||
					queryResult.isFetching ||
					queryResult.isError
				) {
					return;
				}

				nextSelections[productFunction] = collectCheckedPermissionCodes(queryResult.data?.menuList);
				initializedMenuProductsRef.current.add(productFunction);
				hasInitializedSelection = true;
			});

			if (!hasInitializedSelection) {
				return previousSelections;
			}

			const nextBackendModules = mergeBackendModules(nextSelections, filteredProductFunctions);
			const currentBackendModules = form.getFieldValue("backendModules") ?? [];

			if (!areNumberArraysEqual(currentBackendModules, nextBackendModules)) {
				form.setFieldValue("backendModules", nextBackendModules);
			}

			return areProductSelectionsEqual(previousSelections, nextSelections) ? previousSelections : nextSelections;
		});
	}, [availableMenuQueryResults, filteredProductFunctions, form, mode, open]);

	useEffect(() => {
		if (!open) {
			return;
		}

		if (!isDetailMode) {
			setInitializingLoading(false);
			return;
		}

		if (detailLoading) {
			setInitializingLoading(true);
			return;
		}

		// 详情接口回填 businessList 后，会继续按产品功能触发多个菜单查询。
		// 这里统一等待这些查询进入终态，避免用户先看到空树或旧树，再被新数据覆盖。
		const isMenuQueryLoading =
			filteredProductFunctions.length > 0 &&
			availableMenuQueryResults.some((queryResult) => queryResult.isPending || queryResult.isFetching);
		if (isMenuQueryLoading) {
			setInitializingLoading(true);
			return;
		}

		const hasUninitializedMenuSelection =
			filteredProductFunctions.length > 0 &&
			filteredProductFunctions.some((productFunction) => !initializedMenuProductsRef.current.has(productFunction));
		if (hasUninitializedMenuSelection) {
			setInitializingLoading(true);
			return;
		}

		// AI 功能在编辑/查看态下还需要等接口结果完成一次受控回填，
		// 否则会出现选项已经渲染，但默认勾选值还没同步完成的瞬时状态。
		if (hasAiProductSelected) {
			if (availableAiCapabilityLoading || availableAiCapabilityFetching || !hasInitializedAiSelections.current) {
				setInitializingLoading(true);
				return;
			}
		}

		setInitializingLoading(false);
	}, [
		availableAiCapabilityFetching,
		availableAiCapabilityLoading,
		availableMenuQueryResults,
		detailLoading,
		filteredProductFunctions,
		hasAiProductSelected,
		isDetailMode,
		open,
	]);

	const {
		currentTreeData,
		currentAvailablePermissionCodeSet,
		currentLeafTreeKeySet,
		currentTreeKeyToPermissionCodeMap,
		currentTreeKeyToDescendantKeysMap,
		currentTreeKeyToLeafDescendantKeysMap,
	} = useMemo(() => {
		const availablePermissionCodeSet = new Set<number>();
		const leafTreeKeySet = new Set<string>();
		const treeKeyToPermissionCodeMap = new Map<string, number>();
		const treeKeyToDescendantKeysMap = new Map<string, string[]>();
		const treeKeyToLeafDescendantKeysMap = new Map<string, string[]>();

		// Tree 必须使用稳定且唯一的节点 key 做受控勾选。
		// 当前接口返回里 menuCode 全是 null，真正可用的是 permissionCode，
		// 所以这里单独维护 treeKey <-> permissionCode 的映射，保证勾选和提交都基于真实权限值。
		// 这里额外收集每个节点下面的全部权限节点、叶子权限节点，用来支持“显示态”和“交互态”分离。
		const buildTreeNodes = (nodes: MenuSimpleTreeVO[], parentKey = ""): PartnerMenuTreeNode[] =>
			nodes.map((node, index) => {
				const nodeKey = parentKey ? `${parentKey}-${index}` : `root-${index}`;
				const childTreeNodes = node.children?.length ? buildTreeNodes(node.children, nodeKey) : undefined;

				if (isFiniteNumber(node.permissionCode)) {
					availablePermissionCodeSet.add(node.permissionCode);
					treeKeyToPermissionCodeMap.set(nodeKey, node.permissionCode);
				}

				const descendantKeys = [nodeKey];
				const leafDescendantKeys: string[] = [];
				if (childTreeNodes?.length) {
					for (const childTreeNode of childTreeNodes) {
						const childDescendantKeys = treeKeyToDescendantKeysMap.get(childTreeNode.key) ?? [];
						const childLeafDescendantKeys = treeKeyToLeafDescendantKeysMap.get(childTreeNode.key) ?? [];
						descendantKeys.push(...childDescendantKeys);
						leafDescendantKeys.push(...childLeafDescendantKeys);
					}
				} else if (treeKeyToPermissionCodeMap.has(nodeKey)) {
					leafTreeKeySet.add(nodeKey);
					leafDescendantKeys.push(nodeKey);
				}
				treeKeyToDescendantKeysMap.set(
					nodeKey,
					descendantKeys.filter((key) => treeKeyToPermissionCodeMap.has(key)),
				);
				treeKeyToLeafDescendantKeysMap.set(nodeKey, leafDescendantKeys);

				return {
					key: nodeKey,
					title: node.menuName ?? node.menuCode ?? "Unnamed menu",
					children: childTreeNodes,
				};
			});

		return {
			currentTreeData: buildTreeNodes(availableMenuTree),
			currentAvailablePermissionCodeSet: availablePermissionCodeSet,
			currentLeafTreeKeySet: leafTreeKeySet,
			currentTreeKeyToPermissionCodeMap: treeKeyToPermissionCodeMap,
			currentTreeKeyToDescendantKeysMap: treeKeyToDescendantKeysMap,
			currentTreeKeyToLeafDescendantKeysMap: treeKeyToLeafDescendantKeysMap,
		};
	}, [availableMenuTree]);

	const currentCheckedModuleKeys = useMemo<TreeProps<PartnerMenuTreeNode>["checkedKeys"]>(() => {
		const checkedTreeKeys: string[] = [];
		const halfCheckedTreeKeys: string[] = [];
		const visitedTreeKeys = new Set<string>();
		const selectedPermissionCodeSet = new Set(selectedModulesByProduct[activeProductFunction] ?? []);

		// 业务约束：默认回显严格按接口 hasPermission 来；
		// 父节点只有在叶子节点全部选中时才显示完整对号；
		// 如果节点自身已选中、或下面仅部分叶子节点选中，则显示半选态，兼容编辑初始化回显。
		const traverseTreeState = (nodes: PartnerMenuTreeNode[]): void => {
			for (const node of nodes) {
				const nodePermissionCode = currentTreeKeyToPermissionCodeMap.get(node.key);
				const isNodeDirectlyChecked =
					isFiniteNumber(nodePermissionCode) && selectedPermissionCodeSet.has(nodePermissionCode);
				const leafDescendantKeys = currentTreeKeyToLeafDescendantKeysMap.get(node.key) ?? [];
				const selectedLeafCount = leafDescendantKeys.filter((leafKey) => {
					const leafPermissionCode = currentTreeKeyToPermissionCodeMap.get(leafKey);
					return isFiniteNumber(leafPermissionCode) && selectedPermissionCodeSet.has(leafPermissionCode);
				}).length;
				const isLeafNode = currentLeafTreeKeySet.has(node.key);
				const hasLeafDescendants = leafDescendantKeys.length > 0;
				const isAllLeafChecked = hasLeafDescendants && selectedLeafCount === leafDescendantKeys.length;
				const shouldDisplayChecked = isLeafNode ? isNodeDirectlyChecked : isAllLeafChecked;
				const isPartiallyChecked =
					!isLeafNode && !shouldDisplayChecked && (isNodeDirectlyChecked || selectedLeafCount > 0);

				if ((isLeafNode || !node.children?.length) && shouldDisplayChecked && !visitedTreeKeys.has(node.key)) {
					visitedTreeKeys.add(node.key);
					checkedTreeKeys.push(node.key);
				}

				if (!isLeafNode && shouldDisplayChecked && !visitedTreeKeys.has(node.key)) {
					visitedTreeKeys.add(node.key);
					checkedTreeKeys.push(node.key);
				}

				if (!isLeafNode && isPartiallyChecked) {
					halfCheckedTreeKeys.push(node.key);
				}

				if (node.children?.length) {
					traverseTreeState(node.children);
				}
			}
		};

		traverseTreeState(currentTreeData);

		return {
			checked: checkedTreeKeys,
			halfChecked: halfCheckedTreeKeys,
		};
	}, [
		activeProductFunction,
		currentLeafTreeKeySet,
		currentTreeData,
		currentTreeKeyToLeafDescendantKeysMap,
		currentTreeKeyToPermissionCodeMap,
		selectedModulesByProduct,
	]);

	const handleModuleCheck: TreeProps<PartnerMenuTreeNode>["onCheck"] = useCallback(
		(
			_checked: Parameters<NonNullable<TreeProps<PartnerMenuTreeNode>["onCheck"]>>[0],
			info: Parameters<NonNullable<TreeProps<PartnerMenuTreeNode>["onCheck"]>>[1],
		) => {
			if (typeof info.node.key !== "string") {
				return;
			}

			const changedNodeDescendantKeys = currentTreeKeyToDescendantKeysMap.get(info.node.key) ?? [info.node.key];
			setSelectedModulesByProduct((previousSelections) => {
				const currentSelections = new Set(previousSelections[activeProductFunction] ?? []);

				// 交互上保留父子批量选择能力：点击父节点时，整棵子树一起选中或取消；
				// 但最终展示是否为“父节点已全选”，仍由上面的叶子节点汇总结果决定。
				for (const treeKey of changedNodeDescendantKeys) {
					const permissionCode = currentTreeKeyToPermissionCodeMap.get(treeKey);
					if (!isFiniteNumber(permissionCode) || !currentAvailablePermissionCodeSet.has(permissionCode)) {
						continue;
					}

					if (info.checked) {
						currentSelections.add(permissionCode);
					} else {
						currentSelections.delete(permissionCode);
					}
				}

				const nextSelections = {
					...previousSelections,
					[activeProductFunction]: [...currentSelections],
				};
				const nextBackendModules = mergeBackendModules(nextSelections, filteredProductFunctions);
				const currentBackendModules = form.getFieldValue("backendModules") ?? [];

				if (!areNumberArraysEqual(currentBackendModules, nextBackendModules)) {
					form.setFieldValue("backendModules", nextBackendModules);
				}

				return areProductSelectionsEqual(previousSelections, nextSelections) ? previousSelections : nextSelections;
			});
		},
		[
			activeProductFunction,
			currentAvailablePermissionCodeSet,
			currentTreeKeyToPermissionCodeMap,
			currentTreeKeyToDescendantKeysMap,
			filteredProductFunctions,
			form,
		],
	);

	const backendModuleTabItems = useMemo(
		() =>
			filteredProductFunctions.map((productFunction) => {
				return {
					key: productFunction,
					label: getProductFunctionLabel(productFunction),
				};
			}),
		[filteredProductFunctions],
	);
	const validateBackendModules = useCallback(async (): Promise<void> => {
		if (filteredProductFunctions.length === 0) {
			throw new Error("Please select a product feature first");
		}

		const unselectedProductLabels = filteredProductFunctions
			.filter((productFunction) => (selectedModulesByProduct[productFunction] ?? []).length === 0)
			.map(getProductFunctionLabel);

		if (unselectedProductLabels.length > 0) {
			throw new Error(`Select at least one backend feature for ${unselectedProductLabels.join(", ")}`);
		}
	}, [filteredProductFunctions, selectedModulesByProduct]);

	useEffect(() => {
		if (form.getFieldError("backendModules").length === 0) {
			return;
		}

		void form.validateFields(["backendModules"]).catch(() => undefined);
	}, [filteredProductFunctions, form, selectedModulesByProduct]);

	const handleOk = () => {
		if (detailLoading || initializingLoading) {
			return;
		}

		form.submit();
	};

	const onFinish = async (values: PartnerEnterpriseFormData) => {
		if (!isFiniteNumber(values.brandId)) {
			message.error("Please select a partner brand");
			return;
		}

		try {
			setLoading(true);
			if (mode === "edit" && partnerId) {
				await updatePartnerEnterprise(mapFormValuesToUpdateRequest(partnerId, values, selectedModulesByProduct));
				message.success("Partner enterprise updated");
			} else {
				await createPartnerEnterprise(mapFormValuesToSaveRequest(values, selectedModulesByProduct));
				message.success("Partner enterprise created");
			}
			handleCloseModal();
			onSuccess?.();
		} catch (error) {
			message.error(
				getApiErrorMessage(
					error,
					mode === "edit" ? "Failed to update partner enterprise" : "Failed to create partner enterprise",
				),
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal
			title={MODE_TITLE[mode]}
			open={open}
			onOk={handleOk}
			onCancel={handleCloseModal}
			afterOpenChange={handleAfterOpenChange}
			confirmLoading={loading}
			width={560}
			destroyOnHidden
			footer={
				isViewMode
					? [
							<Button key="close" onClick={handleCloseModal}>
								Close
							</Button>,
						]
					: [
							<Button key="cancel" onClick={handleCloseModal}>
								Cancel
							</Button>,
							<Button key="submit" type="primary" loading={loading} onClick={handleOk}>
								OK
							</Button>,
						]
			}
		>
			{/* 只遮罩表单内容，不影响弹窗容器本身，方便统一承接编辑/查看态的初始化加载。 */}
			<Spin spinning={initializingLoading} tip="Loading...">
				<Form
					form={form}
					layout="horizontal"
					labelCol={{ style: { width: 130, minWidth: 130 } }}
					onFinish={onFinish}
					autoComplete="off"
					initialValues={{
						businessList: [DEFAULT_PRODUCT_FUNCTION],
						backendModules: [],
						aiCodeList: [],
						status: 0,
					}}
					disabled={isViewMode || detailLoading || initializingLoading}
				>
					<Form.Item
						name="brandId"
						label={
							<span>
								<Icon icon="ph:star" size={14} className="mr-1 align-middle" />
								Partner Brand
							</span>
						}
						rules={[{ required: true, message: "Please select a partner brand" }]}
					>
						<BrandSelect queryEnabled={open} disabled={shouldDisableImmutableFields || initializingLoading} />
					</Form.Item>

					<Form.Item
						name="name"
						label={
							<span>
								<Icon icon="ph:buildings" size={14} className="mr-1 align-middle" />
								Partner Name
							</span>
						}
						rules={[{ required: true, message: "Please enter the partner name" }]}
					>
						<Input placeholder="Enter…" disabled={shouldDisableImmutableFields || initializingLoading} />
					</Form.Item>

					<Form.Item
						name="principal"
						label={
							<span>
								<Icon icon="ph:user" size={14} className="mr-1 align-middle" />
								Contact Person
							</span>
						}
					>
						<Input placeholder="Enter…" />
					</Form.Item>

					<Form.Item
						name="phone"
						label={
							<span>
								<Icon icon="ph:phone" size={14} className="mr-1 align-middle" />
								Contact Phone
							</span>
						}
						rules={[{ pattern: PHONE_REG, message: "Enter a valid 11-digit phone number" }]}
					>
						<Input placeholder="Enter…" maxLength={11} />
					</Form.Item>

					<Form.Item
						name="businessList"
						label={
							<span>
								<Icon icon="ph:cube" size={14} className="mr-1 align-middle" />
								Product Features
							</span>
						}
						rules={[{ required: true, message: "Select at least one product feature" }]}
					>
						<Checkbox.Group options={PARTNER_ENTERPRISE_PRODUCT_FUNCTION_OPTIONS} />
					</Form.Item>

					<Form.Item
						name="backendModules"
						label={
							<span>
								<Icon icon="ph:monitor" size={14} className="mr-1 align-middle" />
								Backend Features
							</span>
						}
						rules={[{ validator: validateBackendModules }]}
					>
						<div className="rounded-md border border-input p-3 max-h-[200px] overflow-y-auto">
							{selectedBusinessList.length > 1 ? (
								<Tabs
									size="small"
									activeKey={activeProductFunction}
									items={backendModuleTabItems}
									onChange={(activeKey) => setActiveProductFunction(activeKey as PartnerEnterpriseProductFunction)}
								/>
							) : null}
							{filteredProductFunctions.length === 0 ? (
								<div className="py-8 text-center text-sm text-muted-foreground">Select a product feature first</div>
							) : availableMenuTreeLoading ? (
								<div className="py-8 text-center text-sm text-muted-foreground">Loading menus...</div>
							) : availableMenuTreeError ? (
								<div className="py-8 text-center text-sm text-destructive">Failed to load menus</div>
							) : currentTreeData.length === 0 ? (
								<div className="py-8 text-center text-sm text-muted-foreground">No backend features available</div>
							) : (
								<Tree<PartnerMenuTreeNode>
									checkable
									checkStrictly
									defaultExpandAll
									selectable={false}
									treeData={currentTreeData}
									checkedKeys={currentCheckedModuleKeys}
									onCheck={handleModuleCheck}
								/>
							)}
						</div>
					</Form.Item>

					{hasAiProductSelected ? (
						<Form.Item
							label={
								<span>
									<Icon icon="ph:cpu" size={14} className="mr-1 align-middle" />
									AI Features
								</span>
							}
						>
							<div className="space-y-2">
								<Form.Item
									name="aiCodeList"
									rules={[{ required: true, message: "Select at least one AI feature" }]}
									preserve={false}
									style={{ marginBottom: 0 }}
								>
									<Checkbox.Group
										options={aiFunctionOptions}
										disabled={
											isViewMode ||
											initializingLoading ||
											availableAiCapabilityLoading ||
											availableAiCapabilityError ||
											aiFunctionOptions.length === 0
										}
									/>
								</Form.Item>
								{availableAiCapabilityLoading ? (
									<div className="text-sm text-muted-foreground">Loading AI features...</div>
								) : availableAiCapabilityError ? (
									<div className="text-sm text-destructive">Failed to load AI features</div>
								) : aiFunctionOptions.length === 0 ? (
									<div className="text-sm text-muted-foreground">No AI features available</div>
								) : null}
							</div>
						</Form.Item>
					) : null}

					<Form.Item
						name="status"
						label={
							<span>
								<Icon icon="ph:info" size={14} className="mr-1 align-middle" />
								Status
							</span>
						}
						rules={[{ required: true }]}
					>
						<Radio.Group options={PARTNER_ENTERPRISE_STATUS_OPTIONS} />
					</Form.Item>
				</Form>
			</Spin>
		</Modal>
	);
}
