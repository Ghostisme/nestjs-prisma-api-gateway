import { useQuery } from "@tanstack/react-query";
import { Button, Divider, Form, Input, Modal, message, Radio } from "antd";
import { useCallback, useEffect, useState } from "react";
import roleManagementService, {
	type RolePermissionNode,
	type TenantAiAgentGroupVO,
	type TenantAiAgentVO,
} from "@/api/services/roleManagementService";
import AgentPermissionGrid, { getGroupTabKey } from "./AgentPermissionGrid";
import RoleTreeMenu from "./RoleTreeMenu";

const ROLE_NAME_MIN = 1;
const ROLE_NAME_MAX = 15;
const ROLE_DESC_MAX = 60;

const ROLE_STATUS_OPTIONS = [
	{ label: "启用", value: 1 },
	{ label: "禁用", value: 0 },
];

const DATA_SCOPE_OPTIONS = [
	{ label: "全企业数据", value: 2001 },
	{ label: "所属企业数据", value: 2002 },
];

export type RoleFormValues = {
	roleName: string;
	roleDesc: string;
	status: number;
	dataType: number;
	menuIds: number[];
	agentCodes: number[];
};

export interface RoleFormModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	mode: "create" | "edit";
	/** 编辑时传入角色ID，新建时为 null */
	roleId: number | null;
	onSuccess?: () => void;
}

function collectCheckedMenuIds(nodes: RolePermissionNode[]): number[] {
	const result: number[] = [];
	const walk = (items: RolePermissionNode[]) => {
		for (const item of items) {
			if (item.hasPermission === 1) result.push(item.permissionId);
			if (item.children?.length) walk(item.children);
		}
	};
	walk(nodes);
	return result;
}

function getAgentCode(agent: TenantAiAgentVO): number | null {
	return typeof agent.agentCode === "number" ? agent.agentCode : null;
}

function buildSelectedAgentCodesByGroup(groups: TenantAiAgentGroupVO[]): Record<string, number[]> {
	return groups.reduce<Record<string, number[]>>((result, group, index) => {
		result[getGroupTabKey(group, index)] = (group.agentList ?? []).reduce<number[]>((codes, agent) => {
			const agentCode = getAgentCode(agent);
			if (agent.selected === 1 && agentCode !== null) {
				codes.push(agentCode);
			}
			return codes;
		}, []);
		return result;
	}, {});
}

function flattenSelectedAgentCodes(selectedAgentCodesByGroup: Record<string, number[]>): number[] {
	return Array.from(new Set(Object.values(selectedAgentCodesByGroup).flat()));
}

export default function RoleFormModal({ open, onOpenChange, mode, roleId, onSuccess }: RoleFormModalProps) {
	const [form] = Form.useForm<RoleFormValues>();
	const [loading, setLoading] = useState(false);
	const [selectedAgentCodesByGroup, setSelectedAgentCodesByGroup] = useState<Record<string, number[]>>({});
	const isEdit = mode === "edit";

	const { data: roleMenus = [], isPending: roleMenusLoading } = useQuery({
		queryKey: ["role-menus", mode, roleId],
		queryFn: () => {
			if (mode === "edit") {
				if (roleId === null) {
					return Promise.reject(new Error("编辑状态缺少角色ID"));
				}
				return roleManagementService.getRoleMenus(roleId);
			}
			return roleManagementService.getRoleMenus();
		},
		enabled: open && (mode === "create" || roleId !== null),
	});
	const { data: roleDetail, isPending: roleDetailLoading } = useQuery({
		queryKey: ["role-details", roleId],
		queryFn: () => {
			if (roleId === null) {
				return Promise.reject(new Error("缺少角色ID"));
			}
			return roleManagementService.getRoleDetails(roleId);
		},
		enabled: open && mode === "edit" && roleId !== null,
	});
	const { data: agentGroups = [], isPending: agentGroupsLoading } = useQuery({
		queryKey: ["role-agent-groups", mode, roleId],
		queryFn: () => roleManagementService.getAgentGroupList(mode === "edit" && roleId !== null ? { roleId } : undefined),
		enabled: open && (mode === "create" || roleId !== null),
	});

	const menuIds = Form.useWatch("menuIds", form) ?? [];
	const isInitialLoading = roleMenusLoading || agentGroupsLoading || (isEdit && roleDetailLoading);

	useEffect(() => {
		if (!open) return;
		const defaultMenuIds = collectCheckedMenuIds(roleMenus);
		const defaultSelectedAgentCodesByGroup = buildSelectedAgentCodesByGroup(agentGroups);
		const defaultAgentCodes = flattenSelectedAgentCodes(defaultSelectedAgentCodesByGroup);
		setSelectedAgentCodesByGroup(defaultSelectedAgentCodesByGroup);
		if (isEdit && roleDetail) {
			form.setFieldsValue({
				roleName: roleDetail.roleName,
				roleDesc: roleDetail.roleDesc ?? "",
				status: roleDetail.status,
				dataType: roleDetail.dataType ?? 1001,
				menuIds: defaultMenuIds,
				agentCodes: defaultAgentCodes,
			});
		} else {
			form.resetFields();
			form.setFieldsValue({
				status: 1,
				dataType: 1001,
				menuIds: defaultMenuIds,
				agentCodes: defaultAgentCodes,
			});
		}
	}, [open, isEdit, roleDetail, roleMenus, agentGroups, form]);

	const handleAgentChange = useCallback(
		(nextSelectedAgentCodesByGroup: Record<string, number[]>) => {
			setSelectedAgentCodesByGroup(nextSelectedAgentCodesByGroup);
			form.setFieldValue("agentCodes", flattenSelectedAgentCodes(nextSelectedAgentCodesByGroup));
		},
		[form],
	);

	const handlePermissionCheck = (checked: number[]) => {
		form.setFieldValue("menuIds", checked);
	};

	const handleOk = () => {
		form.submit();
	};

	const onFinish = async (values: RoleFormValues) => {
		try {
			setLoading(true);
			if (isEdit && roleId !== null) {
				const payload = { ...values, roleId };
				console.log("[RoleFormModal] updateRole payload:", payload);
				await roleManagementService.updateRole(payload);
				message.success("编辑成功");
			} else {
				console.log("[RoleFormModal] saveRole payload:", values);
				await roleManagementService.saveRole(values);
				message.success("新建成功");
			}
			onOpenChange(false);
			onSuccess?.();
		} catch (err) {
			message.error(isEdit ? `编辑失败：${(err as Error).message}` : `新建失败：${(err as Error).message}`);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal
			title={isEdit ? "编辑角色" : "新建角色"}
			open={open}
			onOk={handleOk}
			onCancel={() => onOpenChange(false)}
			confirmLoading={loading}
			width={"70vw"}
			destroyOnHidden
			footer={[
				<Button key="cancel" onClick={() => onOpenChange(false)}>
					取消
				</Button>,
				<Button key="submit" type="primary" loading={loading} onClick={handleOk}>
					确认
				</Button>,
			]}
		>
			<Form
				form={form}
				layout="horizontal"
				labelCol={{ style: { width: 110, minWidth: 110 } }}
				wrapperCol={{ style: { flex: 1 } }}
				onFinish={onFinish}
				autoComplete="off"
				initialValues={{ status: 1, dataType: 1001, menuIds: [], agentCodes: [] }}
			>
				{isInitialLoading ? (
					<div className="py-8 text-center text-sm text-muted-foreground">加载中...</div>
				) : (
					<>
						<Form.Item
							name="roleName"
							label="角色名"
							validateTrigger="onBlur"
							rules={[
								{ required: true, message: "请输入角色名" },
								{
									min: ROLE_NAME_MIN,
									max: ROLE_NAME_MAX,
									message: `可输入中文、英文、数字、符号，最少${ROLE_NAME_MIN}位数，最大${ROLE_NAME_MAX}位数`,
								},
							]}
						>
							<Input
								placeholder="可输入中文,英文,数字,符号,最少1位数,最大15位数"
								maxLength={ROLE_NAME_MAX}
								showCount={false}
							/>
						</Form.Item>

						<Form.Item
							name="roleDesc"
							label="角色描述"
							rules={[{ max: ROLE_DESC_MAX, message: `最大${ROLE_DESC_MAX}位数` }]}
						>
							<Input placeholder="可输入中文,英文,数字,符号,最大60位数" maxLength={ROLE_DESC_MAX} showCount={false} />
						</Form.Item>

						<Form.Item name="status" label="角色状态" rules={[{ required: true }]}>
							<Radio.Group options={ROLE_STATUS_OPTIONS} />
						</Form.Item>

						<Form.Item name="dataType" label="数据权限" rules={[{ required: true, message: "请选择数据权限" }]}>
							<Radio.Group options={DATA_SCOPE_OPTIONS} />
						</Form.Item>

						<Divider className="my-2" />
						<div className="mb-4">
							<h3 className="text-base font-semibold mb-3 flex items-center gap-2">
								<span className="inline-block w-1 h-4 rounded bg-primary" />
								角色权限
							</h3>
						</div>

						<Form.Item
							name="menuIds"
							label="功能权限"
							rules={[
								{ required: true, message: "请至少选择一项功能权限" },
								{ type: "array", min: 1, message: "请至少选择一项功能权限" },
							]}
						>
							<div className="rounded-md border border-input bg-muted/30 p-4 max-h-[320px] overflow-y-auto">
								{roleMenusLoading ? (
									<div className="py-8 text-center text-sm text-muted-foreground">加载中...</div>
								) : roleMenus.length === 0 ? (
									<div className="py-8 text-center text-sm text-muted-foreground">暂无菜单数据</div>
								) : (
									<RoleTreeMenu nodes={roleMenus} checkedIds={menuIds} onChange={handlePermissionCheck} />
								)}
							</div>
						</Form.Item>

						{/* Agent 权限区域包含多个 Checkbox，不能直接作为 Form.Item 字段容器，否则可能读到原生 checkbox 默认值 "on"。 */}
						<Form.Item name="agentCodes" hidden>
							<Input type="hidden" />
						</Form.Item>
						<Form.Item label="Agent权限">
							<div className="rounded-md border border-input bg-muted/30 p-4">
								{agentGroupsLoading ? (
									<div className="py-8 text-center text-sm text-muted-foreground">加载中...</div>
								) : (
									<AgentPermissionGrid
										groups={agentGroups}
										selectedAgentCodesByGroup={selectedAgentCodesByGroup}
										onChange={handleAgentChange}
									/>
								)}
							</div>
						</Form.Item>
					</>
				)}
			</Form>
		</Modal>
	);
}
