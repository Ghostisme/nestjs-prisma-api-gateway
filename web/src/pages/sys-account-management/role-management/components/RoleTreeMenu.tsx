import { Tree } from "antd";
import { useMemo } from "react";
import type { DataNode, TreeProps } from "antd/es/tree";
import type { RolePermissionNode } from "@/api/services/roleManagementService";

type RoleTreeMenuProps = {
	nodes: RolePermissionNode[];
	checkedIds: number[];
	onChange: (checkedIds: number[]) => void;
};

function getLabelClassName(depth: number): string {
	if (depth === 0) return "text-sm font-bold";
	if (depth === 1) return "text-sm font-semibold";
	return "text-sm font-medium";
}

type RoleTreeDataNode = DataNode & {
	key: string;
	title: string;
	permissionId: number;
	depth: number;
	children?: RoleTreeDataNode[];
};

function buildTreeData(
	nodes: RolePermissionNode[],
	depth: number,
	parentKey: string,
	keyToPermissionIdMap: Map<string, number>,
	idToTreeKeysMap: Map<number, string[]>,
): RoleTreeDataNode[] {
	return nodes.map((node, index) => {
		const nodeKey = parentKey ? `${parentKey}-${index}` : `root-${index}`;
		keyToPermissionIdMap.set(nodeKey, node.permissionId);
		const treeKeys = idToTreeKeysMap.get(node.permissionId) ?? [];
		treeKeys.push(nodeKey);
		idToTreeKeysMap.set(node.permissionId, treeKeys);

		return {
			key: nodeKey,
			title: node.permissionName,
			permissionId: node.permissionId,
			depth,
			children: buildTreeData(node.children ?? [], depth + 1, nodeKey, keyToPermissionIdMap, idToTreeKeysMap),
		};
	});
}

export default function RoleTreeMenu({ nodes, checkedIds, onChange }: RoleTreeMenuProps) {
	const { treeData, keyToPermissionIdMap, idToTreeKeysMap } = useMemo(() => {
		const keyMap = new Map<string, number>();
		const idMap = new Map<number, string[]>();
		const data = buildTreeData(nodes, 0, "", keyMap, idMap);
		return { treeData: data, keyToPermissionIdMap: keyMap, idToTreeKeysMap: idMap };
	}, [nodes]);

	const checkedTreeKeys = useMemo(() => {
		const result: string[] = [];
		const visited = new Set<string>();
		for (const permissionId of checkedIds) {
			const treeKeys = idToTreeKeysMap.get(permissionId) ?? [];
			for (const treeKey of treeKeys) {
				if (visited.has(treeKey)) continue;
				visited.add(treeKey);
				result.push(treeKey);
			}
		}
		return result;
	}, [checkedIds, idToTreeKeysMap]);

	const handleCheck: TreeProps<RoleTreeDataNode>["onCheck"] = (checkedKeys) => {
		const checkedKeyList = Array.isArray(checkedKeys) ? checkedKeys : checkedKeys.checked;
		const permissionIds: number[] = [];
		const seen = new Set<number>();
		for (const checkedKey of checkedKeyList) {
			const permissionId = keyToPermissionIdMap.get(String(checkedKey));
			if (permissionId === undefined || seen.has(permissionId)) continue;
			seen.add(permissionId);
			permissionIds.push(permissionId);
		}
		onChange(permissionIds);
	};

	return (
		<Tree<RoleTreeDataNode>
			checkable
			defaultExpandAll
			selectable={false}
			treeData={treeData}
			checkedKeys={checkedTreeKeys}
			onCheck={handleCheck}
			titleRender={(node) => <span className={getLabelClassName(node.depth)}>{node.title as string}</span>}
		/>
	);
}
