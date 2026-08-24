import { App, Avatar, Button, Card, Empty, Input, List, Spin, Tag, Tree } from "antd";
import type { DataNode } from "antd/es/tree";
import { type JSX, useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import aiManagementService from "@/api/services/aiManagementService";
import { AuthGuard } from "@/components/auth/auth-guard";
import Icon from "@/components/icon/icon";
import { LMX_ADMIN_PERMISSIONS } from "@/pages/rbac/permissions";
import type { OrgMember, OrgNode, TokenConfigPayload } from "../types";
import { ConfigTokenModal } from "./components/ConfigTokenModal";

type TreeNode = DataNode & {
	nodeType: "company" | "department";
	memberCount: number;
	original: OrgNode;
};

const buildTreeData = (node: OrgNode): TreeNode => ({
	key: node.nodeId,
	nodeType: node.nodeType,
	memberCount: node.memberCount,
	original: node,
	title: (
		<span className="inline-flex items-center gap-1">
			<span>{node.nodeName}</span>
			<span className="text-xs text-[var(--muted-foreground)]">({node.memberCount})</span>
		</span>
	),
	children: node.children?.map(buildTreeData),
});

const filterTree = (node: TreeNode, keyword: string): TreeNode | null => {
	const children = (node.children as TreeNode[] | undefined)
		?.map((child) => filterTree(child, keyword))
		.filter((c): c is TreeNode => c !== null);
	const matched = node.original.nodeName.includes(keyword);
	if (matched || (children && children.length > 0)) {
		return { ...node, children };
	}
	return null;
};

const renderQuotaTag = (member: OrgMember): JSX.Element => {
	if (member.remainToken === -1 || member.tokenQuota === -1) {
		return <Tag color="gold">Unlimited</Tag>;
	}
	return (
		<Tag color="blue">
			Available {member.remainToken ?? 0} / {member.tokenQuota}
		</Tag>
	);
};

export default function TokenSystemManagementPage(): JSX.Element {
	const { message } = App.useApp();
	const queryClient = useQueryClient();

	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
	const [searchKeyword, setSearchKeyword] = useState<string>("");
	const [configModal, setConfigModal] = useState<{
		open: boolean;
		scope: "node" | "member";
		targetId: string;
		targetName: string;
	}>({ open: false, scope: "node", targetId: "", targetName: "" });

	const { data: orgTree, isLoading: treeLoading } = useQuery({
		queryKey: ["token-system-org-tree"],
		queryFn: () => aiManagementService.getOrgTree(),
	});

	const effectiveNodeId = selectedNodeId ?? orgTree?.nodeId ?? null;

	const { data: nodeDetail, isLoading: detailLoading } = useQuery({
		queryKey: ["token-system-node-detail", effectiveNodeId],
		queryFn: () => aiManagementService.getOrgNodeDetail(effectiveNodeId as string),
		enabled: !!effectiveNodeId,
	});

	const treeData = useMemo<TreeNode[]>(() => {
		if (!orgTree) return [];
		const root = buildTreeData(orgTree);
		if (!searchKeyword.trim()) return [root];
		const filtered = filterTree(root, searchKeyword.trim());
		return filtered ? [filtered] : [];
	}, [orgTree, searchKeyword]);

	const defaultExpandedKeys = useMemo<string[]>(() => {
		if (!orgTree) return [];
		return [orgTree.nodeId];
	}, [orgTree]);

	const handleSelectNode = useCallback((keys: React.Key[]) => {
		if (keys.length > 0) {
			setSelectedNodeId(String(keys[0]));
		}
	}, []);

	const handleOpenNodeConfig = useCallback((nodeId: string, nodeName: string) => {
		setConfigModal({
			open: true,
			scope: "node",
			targetId: nodeId,
			targetName: nodeName,
		});
	}, []);

	const handleOpenMemberConfig = useCallback((memberId: string, memberName: string) => {
		setConfigModal({
			open: true,
			scope: "member",
			targetId: memberId,
			targetName: memberName,
		});
	}, []);

	const handleCloseModal = useCallback(() => {
		setConfigModal((prev) => ({ ...prev, open: false }));
	}, []);

	const handleConfirmConfig = useCallback(
		async (payload: TokenConfigPayload): Promise<void> => {
			if (configModal.scope === "node") {
				await aiManagementService.configureNodeToken(configModal.targetId, payload);
				message.success("Department token quota updated");
			} else {
				await aiManagementService.configureMemberToken(configModal.targetId, payload);
				message.success("Member token quota updated");
			}
			setConfigModal((prev) => ({ ...prev, open: false }));
			queryClient.invalidateQueries({ queryKey: ["token-system-org-tree"] });
			queryClient.invalidateQueries({ queryKey: ["token-system-node-detail"] });
		},
		[configModal, message, queryClient],
	);

	return (
		<div className="p-4">
			<div className="flex gap-4 min-h-[calc(100vh-160px)]">
				<Card
					className="w-72 shrink-0"
					styles={{ body: { padding: 12 } }}
					title={
						<div className="flex items-center gap-2">
							<Icon icon="ph:buildings" size={16} />
							<span>Organization</span>
						</div>
					}
				>
					<Input
						allowClear
						size="small"
						placeholder="Search department"
						prefix={<Icon icon="ph:magnifying-glass" size={14} />}
						value={searchKeyword}
						onChange={(e) => setSearchKeyword(e.target.value)}
						className="mb-2"
					/>
					<Spin spinning={treeLoading}>
						{treeData.length > 0 ? (
							<Tree
								blockNode
								showLine={false}
								treeData={treeData}
								defaultExpandedKeys={defaultExpandedKeys}
								selectedKeys={effectiveNodeId ? [effectiveNodeId] : []}
								onSelect={handleSelectNode}
							/>
						) : (
							<Empty description="No data" image={Empty.PRESENTED_IMAGE_SIMPLE} />
						)}
					</Spin>
				</Card>

				<Card className="flex-1" styles={{ body: { padding: 16 } }}>
					<Spin spinning={detailLoading}>
						{nodeDetail ? (
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Icon
											icon={nodeDetail.nodeType === "company" ? "ph:buildings-bold" : "ph:users-three-bold"}
											size={20}
											style={{ color: "var(--colors-palette-primary-default)" }}
										/>
										<span className="text-lg font-semibold">{nodeDetail.nodeName}</span>
										<Tag color={nodeDetail.nodeType === "company" ? "purple" : "blue"}>
											{nodeDetail.nodeType === "company" ? "Company" : "Department"}
										</Tag>
									</div>
									{nodeDetail.nodeType === "department" && (
										<AuthGuard check={LMX_ADMIN_PERMISSIONS.aiManagement_tokenSystemManagement_configDept}>
											<Button
												type="primary"
												icon={<Icon icon="ph:gear" size={14} />}
												onClick={() => handleOpenNodeConfig(nodeDetail.nodeId, nodeDetail.nodeName)}
											>
												Configure Dept Tokens
											</Button>
										</AuthGuard>
									)}
								</div>

								{nodeDetail.directMembers.length > 0 && (
									<div>
										<div className="text-sm font-medium mb-2 text-[var(--foreground)]">Direct Members</div>
										<List
											bordered
											dataSource={nodeDetail.directMembers}
											renderItem={(member) => (
												<List.Item
													actions={[
														<AuthGuard
															key="config"
															check={LMX_ADMIN_PERMISSIONS.aiManagement_tokenSystemManagement_configMember}
														>
															<Button
																type="primary"
																size="small"
																onClick={() => handleOpenMemberConfig(member.memberId, member.memberName)}
															>
																Manage Quota
															</Button>
														</AuthGuard>,
													]}
												>
													<List.Item.Meta
														avatar={
															<Avatar
																style={{
																	backgroundColor: "var(--colors-palette-primary-default)",
																}}
															>
																{member.memberName.slice(0, 1)}
															</Avatar>
														}
														title={
															<div className="flex items-center gap-2">
																<span>{member.memberName}</span>
																{renderQuotaTag(member)}
															</div>
														}
														description={member.department}
													/>
												</List.Item>
											)}
										/>
									</div>
								)}

								{nodeDetail.subDepartments.length > 0 && (
									<div>
										<div className="text-sm font-medium mb-2 text-[var(--foreground)]">Sub-departments</div>
										<List
											bordered
											dataSource={nodeDetail.subDepartments}
											renderItem={(dept) => (
												<List.Item
													actions={[
														<AuthGuard
															key="view"
															check={LMX_ADMIN_PERMISSIONS.aiManagement_tokenSystemManagement_viewDetail}
														>
															<Button size="small" onClick={() => setSelectedNodeId(dept.nodeId)}>
																View Details
															</Button>
														</AuthGuard>,
														<AuthGuard
															key="config"
															check={LMX_ADMIN_PERMISSIONS.aiManagement_tokenSystemManagement_configDept}
														>
															<Button
																type="primary"
																size="small"
																onClick={() => handleOpenNodeConfig(dept.nodeId, dept.nodeName)}
															>
																Configure Dept Tokens
															</Button>
														</AuthGuard>,
													]}
												>
													<List.Item.Meta
														avatar={
															<Avatar
																shape="square"
																style={{
																	backgroundColor: "var(--colors-palette-info-default)",
																}}
															>
																{dept.nodeName.slice(0, 1)}
															</Avatar>
														}
														title={
															<div className="flex items-center gap-2">
																<span>{dept.nodeName}</span>
																<Tag>{dept.memberCount} members</Tag>
															</div>
														}
														description="Click View Details to see this department's members"
													/>
												</List.Item>
											)}
										/>
									</div>
								)}

								{nodeDetail.directMembers.length === 0 && nodeDetail.subDepartments.length === 0 && (
									<Empty description="No members or sub-departments under this node" />
								)}
							</div>
						) : (
							<Empty description="Select a department on the left to view details" />
						)}
					</Spin>
				</Card>
			</div>

			<ConfigTokenModal
				open={configModal.open}
				scope={configModal.scope}
				targetName={configModal.targetName}
				onClose={handleCloseModal}
				onConfirm={handleConfirmConfig}
			/>
		</div>
	);
}
