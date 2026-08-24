import { useQuery } from "@tanstack/react-query";
import { TreeSelect } from "antd";
import type { TreeSelectProps } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import materialService from "@/api/material/materialService";
import type { MaterialBrandItem } from "@/api/material/types";

type TreeDataNode = NonNullable<TreeSelectProps["treeData"]>[number];
const EMPTY_BRANDS: MaterialBrandItem[] = [];
const BRAND_TREE_SELECT_POPUP_MIN_WIDTH = 380;
const BRAND_TREE_SELECT_POPUP_MAX_WIDTH = "calc(100vw - 32px)";
const TREE_NODE_TEXT_CLASS = "inline-block min-w-max whitespace-nowrap";

export interface BrandTreeSelectBaseProps {
	placeholder?: string;
	disabled?: boolean;
	showSearch?: boolean;
	showScrollBar?: boolean;
	allowClear?: boolean;
	treeDefaultExpandAll?: boolean;
	maxTagCount?: TreeSelectProps["maxTagCount"];
	disableModel?: boolean;
}

export interface BrandTreeSelectSingleProps extends BrandTreeSelectBaseProps {
	multiple?: false;
	value?: string;
	onChange?: (value: string | undefined) => void;
}

export interface BrandTreeSelectMultipleProps extends BrandTreeSelectBaseProps {
	multiple: true;
	value?: string[];
	onChange?: (value: string[]) => void;
}

export type BrandTreeSelectProps = BrandTreeSelectSingleProps | BrandTreeSelectMultipleProps;

function renderTreeNodeText(text: string) {
	return <span className={TREE_NODE_TEXT_CLASS}>{text}</span>;
}

function getTreeNodeLabel(node: TreeDataNode): string {
	const fullPathLabel = (node as TreeDataNode & { fullPathLabel?: string }).fullPathLabel;
	if (typeof fullPathLabel === "string" && fullPathLabel) return fullPathLabel;
	return typeof node.title === "string" ? node.title : "";
}

function appendChildrenByKey(nodes: TreeDataNode[], key: string, children: TreeDataNode[]): TreeDataNode[] {
	let hasChanged = false;
	const nextNodes = nodes.map((node) => {
		if (String(node.key) === key) {
			hasChanged = true;
			return {
				...node,
				children,
				// If backend returns empty children, mark as leaf to avoid repeated load requests.
				isLeaf: children.length === 0,
			};
		}
		if (!node.children || node.children.length === 0) return node;
		const nextChildren = appendChildrenByKey(node.children, key, children);
		if (nextChildren !== node.children) {
			hasChanged = true;
			return { ...node, children: nextChildren };
		}
		return node;
	});
	return hasChanged ? nextNodes : nodes;
}

function hasNodeByKey(nodes: TreeDataNode[], key: string): boolean {
	for (const node of nodes) {
		if (String(node.key) === key) return true;
		if (node.children && node.children.length > 0 && hasNodeByKey(node.children, key)) {
			return true;
		}
	}
	return false;
}

function mergeRootTreeWithLoadedChildren(
	rootNodes: TreeDataNode[],
	loadedChildrenMap: ReadonlyMap<string, TreeDataNode[]>,
): TreeDataNode[] {
	return rootNodes.map((node) => {
		const nodeKey = String(node.key);
		const loadedChildren = loadedChildrenMap.get(nodeKey);
		if (!loadedChildren) return node;
		return {
			...node,
			children: loadedChildren,
			isLeaf: loadedChildren.length === 0,
		};
	});
}

function buildBrandRoots(brands: MaterialBrandItem[]): TreeDataNode[] {
	return brands.map((brand) => ({
		title: renderTreeNodeText(brand.brandName),
		value: String(brand.brandId),
		key: String(brand.brandId),
		fullPathLabel: brand.brandName,
		isLeaf: false,
	}));
}

const DROPDOWN_HIDE_SCROLLBAR_CLASS = "brand-tree-select-dropdown-hide-scrollbar";

export function BrandTreeSelect({
	value,
	onChange,
	placeholder = "Select brand/model/series",
	disabled = false,
	showSearch = true,
	showScrollBar = true,
	allowClear = true,
	treeDefaultExpandAll = false,
	maxTagCount = "responsive",
	multiple = false,
	disableModel = false,
}: BrandTreeSelectProps) {
	const [treeData, setTreeData] = useState<TreeDataNode[]>([]);
	const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const [loadedKeys, setLoadedKeys] = useState<string[]>([]);
	const { data: brandsData } = useQuery({
		queryKey: ["material-brand-list"],
		queryFn: () => materialService.getBrandList(),
	});
	const brands = brandsData ?? EMPTY_BRANDS;

	const rootTree = useMemo(() => buildBrandRoots(brands), [brands]);

	const loadBrandChildren = useCallback(
		async (brandId: number, brandLabel: string): Promise<TreeDataNode[]> => {
			const modelTree = await materialService.getCarModelListByBrand(brandId);
			return modelTree.map((subBrand) => {
				const subBrandPath = `${brandId},${subBrand.subBrandId}`;
				const subBrandLabel = `${brandLabel}/${subBrand.subBrandName}`;
				const seriesChildren: TreeDataNode[] = (subBrand.seriesList ?? []).map((series) => {
					const seriesPath = `${subBrandPath},${series.seriesId}`;
					const seriesLabel = `${subBrandLabel}/${series.seriesName}`;
					const carChildren: TreeDataNode[] = disableModel
						? []
						: (series.carModels ?? []).map((car) => ({
								title: renderTreeNodeText(car.carName),
								value: `${seriesPath},${car.carId}`,
								key: `${seriesPath},${car.carId}`,
								fullPathLabel: `${seriesLabel}/${car.carName}`,
								isLeaf: true,
							}));
					return {
						title: renderTreeNodeText(series.seriesName),
						value: seriesPath,
						key: seriesPath,
						fullPathLabel: seriesLabel,
						isLeaf: disableModel ? true : carChildren.length === 0,
						children: disableModel ? undefined : carChildren.length > 0 ? carChildren : undefined,
					};
				});
				return {
					title: renderTreeNodeText(subBrand.subBrandName),
					value: subBrandPath,
					key: subBrandPath,
					fullPathLabel: subBrandLabel,
					isLeaf: seriesChildren.length === 0,
					children: seriesChildren.length > 0 ? seriesChildren : undefined,
				};
			});
		},
		[disableModel],
	);

	const loadData = async (node: TreeDataNode): Promise<void> => {
		const nodeKey = String(node.key ?? "");
		const path = nodeKey.split(",").filter(Boolean);
		if (path.length !== 1) return;
		if (node.children && node.children.length > 0) return;

		const cachedChildren = loadedBrandChildrenRef.current.get(nodeKey);
		if (cachedChildren) {
			setTreeData((prev) => appendChildrenByKey(prev, nodeKey, cachedChildren));
			setLoadedKeys(Array.from(loadedBrandChildrenRef.current.keys()));
			return;
		}

		const brandId = Number(path[0]);
		if (Number.isNaN(brandId)) return;
		if (loadingBrandIdsRef.current.has(brandId)) return;

		loadingBrandIdsRef.current.add(brandId);
		const brandLabel = getTreeNodeLabel(node);
		try {
			const children = await loadBrandChildren(brandId, brandLabel);
			persistLoadedBrandChildren(nodeKey, children);
			setTreeData((prev) => appendChildrenByKey(prev, nodeKey, children));
		} finally {
			loadingBrandIdsRef.current.delete(brandId);
		}
	};

	const valuesToPreload = multiple ? (value ?? []) : value != null ? [value] : [];
	const PRELOAD_VALUES_SEP = "|";
	const valuesToPreloadKey = useMemo(
		() =>
			Array.isArray(valuesToPreload) && valuesToPreload.length > 0 ? valuesToPreload.join(PRELOAD_VALUES_SEP) : "",
		[valuesToPreload],
	);
	const loadingBrandIdsRef = useRef<Set<number>>(new Set());
	const loadedBrandChildrenRef = useRef<Map<string, TreeDataNode[]>>(new Map());
	const keepDropdownOpenRef = useRef(false);
	const treeDataRef = useRef(treeData);
	treeDataRef.current = treeData;

	const persistLoadedBrandChildren = useCallback((brandKey: string, children: TreeDataNode[]) => {
		loadedBrandChildrenRef.current.set(brandKey, children);
		setLoadedKeys(Array.from(loadedBrandChildrenRef.current.keys()));
	}, []);

	useEffect(() => {
		const rootKeySet = new Set(rootTree.map((node) => String(node.key)));
		for (const cachedKey of loadedBrandChildrenRef.current.keys()) {
			if (!rootKeySet.has(cachedKey)) {
				loadedBrandChildrenRef.current.delete(cachedKey);
			}
		}
		setTreeData(mergeRootTreeWithLoadedChildren(rootTree, loadedBrandChildrenRef.current));
		setLoadedKeys(Array.from(loadedBrandChildrenRef.current.keys()));
		if (treeDefaultExpandAll) {
			setExpandedKeys(rootTree.map((node) => String(node.key)));
		}
	}, [rootTree, treeDefaultExpandAll]);

	useEffect(() => {
		if (valuesToPreloadKey === "") return;

		const currentTreeData = treeDataRef.current;
		const valuesList = [...new Set(valuesToPreloadKey.split(PRELOAD_VALUES_SEP).filter(Boolean))];

		for (const singleValue of valuesList) {
			const path = singleValue.split(",").filter(Boolean);
			if (path.length <= 1) continue;
			const brandId = Number(path[0]);
			if (Number.isNaN(brandId)) continue;
			if (loadingBrandIdsRef.current.has(brandId)) continue;
			if (hasNodeByKey(currentTreeData, singleValue)) continue;

			const rootNode = rootTree.find((item) => String(item.key) === String(brandId));
			if (!rootNode) continue;

			loadingBrandIdsRef.current.add(brandId);
			const brandLabel = getTreeNodeLabel(rootNode);
			void loadBrandChildren(brandId, brandLabel)
				.then((children) => {
					persistLoadedBrandChildren(String(brandId), children);
					setTreeData((prev) => appendChildrenByKey(prev, String(brandId), children));
				})
				.finally(() => {
					loadingBrandIdsRef.current.delete(brandId);
				});
		}
	}, [persistLoadedBrandChildren, rootTree, valuesToPreloadKey, loadBrandChildren]);

	const treeValue = multiple ? (value ?? []) : value;
	const handleChange = (nextValue: string | string[] | undefined) => {
		if (multiple) {
			(onChange as BrandTreeSelectMultipleProps["onChange"])?.(Array.isArray(nextValue) ? nextValue : []);
		} else {
			(onChange as BrandTreeSelectSingleProps["onChange"])?.(nextValue as string | undefined);
		}
	};

	const handleSelect = useCallback((_val: unknown, node: TreeDataNode) => {
		if (!node.isLeaf) {
			const key = String(node.key);
			keepDropdownOpenRef.current = true;
			setDropdownOpen(true);
			setExpandedKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
		}
	}, []);

	const handleOpenChange = useCallback((nextOpen: boolean) => {
		if (!nextOpen && keepDropdownOpenRef.current) {
			keepDropdownOpenRef.current = false;
			setDropdownOpen(true);
			return;
		}
		keepDropdownOpenRef.current = false;
		setDropdownOpen(nextOpen);
	}, []);

	return (
		<TreeSelect
			className="w-full"
			value={treeValue}
			open={dropdownOpen}
			onChange={handleChange}
			onSelect={handleSelect}
			onOpenChange={handleOpenChange}
			placeholder={placeholder}
			disabled={disabled}
			showSearch={showSearch}
			treeNodeFilterProp="fullPathLabel"
			allowClear={allowClear}
			treeData={treeData}
			treeNodeLabelProp="fullPathLabel"
			loadData={loadData}
			treeLoadedKeys={loadedKeys}
			treeExpandAction="click"
			treeExpandedKeys={expandedKeys}
			onTreeExpand={(keys) => setExpandedKeys(keys as string[])}
			multiple={multiple}
			maxTagCount={multiple ? maxTagCount : undefined}
			popupMatchSelectWidth={false}
			styles={{
				popup: {
					root: {
						minWidth: BRAND_TREE_SELECT_POPUP_MIN_WIDTH,
						width: "max-content",
						maxWidth: BRAND_TREE_SELECT_POPUP_MAX_WIDTH,
					},
				},
			}}
			classNames={{
				popup: { root: showScrollBar ? "" : DROPDOWN_HIDE_SCROLLBAR_CLASS },
			}}
		/>
	);
}
