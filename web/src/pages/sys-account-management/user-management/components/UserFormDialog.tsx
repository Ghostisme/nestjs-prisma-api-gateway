import { useQuery } from "@tanstack/react-query";
import { Button, Checkbox, Form, Input, Modal, message, Radio, Select, TreeSelect } from "antd";
import { useEffect, useMemo, useState } from "react";
import roleManagementService from "@/api/services/roleManagementService";
import userManagementService, {
	type UserSaveParams,
	type UserUpdateParams,
} from "@/api/services/userManagementService";
import { useAuthCheck } from "@/components/auth/use-auth";
import Icon from "@/components/icon/icon";
import { LMX_ADMIN_PERMISSIONS } from "@/pages/rbac/permissions";
import type { TreeSelectOption } from "@/components/table/types";

const PASSWORD_MIN_LEN = 8;
const PASSWORD_MAX_LEN = 15;

const PHONE_REG = /^1[3-9]\d{9}$/;

const STATUS_OPTIONS = [
	{ label: "启用", value: 0 },
	{ label: "禁用", value: 1 },
];

type FormValues = {
	username: string;
	password: string;
	confirmPassword: string;
	name: string;
	deptIds?: string[];
	roleIds: string;
	phone: string;
	email: string;
	capabilityCodes?: string[];
	status: number;
};

type UserSubmitParams = Omit<UserSaveParams, "deptIds"> & {
	deptIds?: UserSaveParams["deptIds"];
};

interface UserFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	userId: number | null;
	deptTreeData: TreeSelectOption[];
	onSuccess?: () => void;
}

export default function UserFormDialog({ open, onOpenChange, userId, deptTreeData, onSuccess }: UserFormDialogProps) {
	const [form] = Form.useForm<FormValues>();
	const [loading, setLoading] = useState(false);
	const isEdit = userId !== null;
	// 仅拥有部门查看权限的账号，才允许在用户弹窗中查看/编辑所属部门。
	const { check } = useAuthCheck();
	const canViewDept = check(LMX_ADMIN_PERMISSIONS.dept_read);

	const { data: detail, isPending: detailLoading } = useQuery({
		queryKey: ["user-details", userId],
		queryFn: () => {
			if (userId === null) {
				return Promise.reject(new Error("缺少用户ID"));
			}
			return userManagementService.getUserDetails(userId);
		},
		enabled: open && userId !== null,
	});
	const { data: roleList = [], isPending: roleLoading } = useQuery({
		queryKey: ["role-simple-all"],
		queryFn: () => roleManagementService.getRoleSimpleAll(),
		enabled: open,
	});
	const roleOptions = useMemo(() => roleList.map((role) => ({ label: role.roleName, value: role.roleId })), [roleList]);
	const { data: aiCapabilityItems = [], isPending: aiCapabilityLoading } = useQuery({
		queryKey: ["ai-capability-simple-list"],
		queryFn: () => userManagementService.getAiCapabilitySimpleList(),
		enabled: open,
	});
	const platformOptions = useMemo(
		() =>
			aiCapabilityItems.flatMap((item) => {
				const label = item.label?.trim();
				const value = item.value?.trim();
				if (!label || !value) {
					return [];
				}
				return [{ label, value }];
			}),
		[aiCapabilityItems],
	);

	useEffect(() => {
		if (!open) return;
		if (isEdit && detail) {
			form.setFieldsValue({
				username: detail.username,
				password: "",
				confirmPassword: "",
				name: detail.name,
				// 无部门权限时不回填所属部门，保持表单与界面展示一致。
				deptIds: canViewDept ? detail.deptList.map((item) => item.deptId) : undefined,
				roleIds: detail.roleList.length !== 0 ? detail.roleList[0].roleId : "", // 暂时没有放开批量操作角色因此有且仅有一个选项，所以暂时用索引0取值
				// roleIds: detail.roleList.map((item) => item.roleId),
				phone: detail.phone,
				email: detail.email,
				capabilityCodes: detail.capabilityCodes?.map((item) => String(item)) ?? [],
				status: detail.status,
			});
		} else {
			form.resetFields();
			form.setFieldsValue({
				status: 0,
			});
		}
	}, [open, isEdit, detail, form]);

	const handleOk = () => {
		form.submit();
	};

	const onFinish = async (values: FormValues) => {
		try {
			setLoading(true);
			let params: UserSubmitParams = {
				username: values.username,
				password: values.password,
				confirmPassword: values.confirmPassword,
				name: values.name,
				roleIds: values.roleIds ? [values.roleIds] : [],
				phone: values.phone,
				email: values.email,
				status: values.status,
				capabilityCodes: (values.capabilityCodes ?? [])
					.map((item) => Number(item))
					.filter((item) => Number.isFinite(item)) as UserSaveParams["capabilityCodes"],
			};
			// 无部门权限时不向后端提交 deptIds，避免隐藏字段被误更新。
			if (canViewDept) {
				params.deptIds = values.deptIds ?? [];
			}
			// isEdit 属于是否为编辑模式下的前端状态值
			if (isEdit) {
				if (!userId) {
					message.error("缺少用户ID");
					return;
				}
				params = {
					...params,
					userId,
				} as UserUpdateParams;
			}
			isEdit
				? await userManagementService.updateUser(params as UserUpdateParams)
				: await userManagementService.saveUser(params as UserSaveParams);
			message.success(isEdit ? "编辑成功" : "新建成功");
			onOpenChange(false);
			onSuccess?.();
		} catch (err) {
			message.error(isEdit ? `编辑失败-${err.message}` : `新建失败-${err.message}`);
			console.log(err);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal
			title={isEdit ? "编辑用户" : "新建用户"}
			open={open}
			onOk={handleOk}
			onCancel={() => onOpenChange(false)}
			confirmLoading={loading}
			width={560}
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
				onFinish={onFinish}
				autoComplete="off"
				initialValues={{ status: 0 }}
			>
				{isEdit && detailLoading ? (
					<div className="py-8 text-center text-sm text-muted-foreground">加载中...</div>
				) : (
					<>
						<Form.Item
							name="username"
							label={
								<span>
									<Icon icon="ph:user" size={14} className="mr-1 align-middle" />
									用户名
								</span>
							}
							rules={[{ required: true, message: "请输入手机号" }]}
						>
							<Input placeholder="请输入手机号" maxLength={11} showCount disabled={isEdit} />
						</Form.Item>

						{!isEdit && (
							<>
								<Form.Item
									name="password"
									label={
										<span>
											<Icon icon="ph:lock" size={14} className="mr-1 align-middle" />
											密码
										</span>
									}
									rules={[
										{
											validator(_, value) {
												if (!value) return Promise.resolve();
												if (value.length < PASSWORD_MIN_LEN || value.length > PASSWORD_MAX_LEN) {
													return Promise.reject(
														new Error(
															`可输入英文、数字、符号，最少${PASSWORD_MIN_LEN}位数，最大${PASSWORD_MAX_LEN}位数`,
														),
													);
												}
												return Promise.resolve();
											},
										},
									]}
								>
									<Input.Password placeholder="可输入英文,数字,符号,最少8位数,最大15位数" autoComplete="new-password" />
								</Form.Item>

								<Form.Item
									name="confirmPassword"
									label={
										<span>
											<Icon icon="ph:key" size={14} className="mr-1 align-middle" />
											确认密码
										</span>
									}
									dependencies={["password"]}
									rules={[
										({ getFieldValue }) => ({
											validator(_, value) {
												if (!value || getFieldValue("password") === value) return Promise.resolve();
												return Promise.reject(new Error("两次输入的密码不一致"));
											},
										}),
									]}
								>
									<Input.Password placeholder="再次输入密码" autoComplete="new-password" />
								</Form.Item>
							</>
						)}

						<Form.Item
							name="email"
							label={
								<span>
									<Icon icon="ph:envelope-simple" size={14} className="mr-1 align-middle" />
									联系邮箱
								</span>
							}
							rules={[
								{ required: true, message: "请输入联系邮箱地址" },
								{ type: "email", message: "请输入有效的邮箱地址" },
							]}
						>
							<Input placeholder="请输入联系邮箱地址" />
						</Form.Item>

						<Form.Item
							name="phone"
							label={
								<span>
									<Icon icon="ph:phone" size={14} className="mr-1 align-middle" />
									联系电话
								</span>
							}
							rules={[
								{ required: true, message: "请输入联系电话号码" },
								{
									pattern: PHONE_REG,
									message: "请输入正确的11位手机号码",
								},
							]}
						>
							<Input placeholder="请输入联系电话号码" showCount maxLength={11} />
						</Form.Item>

						<Form.Item
							name="name"
							label={
								<span>
									<Icon icon="ph:user-circle" size={14} className="mr-1 align-middle" />
									姓名
								</span>
							}
							rules={[{ required: true, message: "请输入注册人姓名" }]}
						>
							<Input placeholder="请输入注册人姓名" showCount maxLength={50} />
						</Form.Item>

						<Form.Item
							name="roleIds"
							label={
								<span>
									<Icon icon="ph:identification-badge" size={14} className="mr-1 align-middle" />
									选择角色
								</span>
							}
							rules={[{ required: true, message: "请选择" }]}
						>
							<Select placeholder="请选择" options={roleOptions} allowClear loading={roleLoading} />
						</Form.Item>

						{canViewDept && (
							<Form.Item
								name="deptIds"
								label={
									<span>
										<Icon icon="ph:buildings" size={14} className="mr-1 align-middle" />
										所属部门
									</span>
								}
							>
								<TreeSelect
									placeholder="请选择"
									showSearch
									showScrollBar
									multiple
									treeData={deptTreeData}
									allowClear
									treeDefaultExpandAll
									showCheckedStrategy={TreeSelect.SHOW_CHILD}
									maxTagCount="responsive"
								/>
							</Form.Item>
						)}

						<Form.Item
							name="capabilityCodes"
							label={
								<span>
									<Icon icon="ph:plugs-connected" size={14} className="mr-1 align-middle" />
									关联平台
								</span>
							}
							rules={[{ required: true, message: "请至少选择一个关联平台" }]}
						>
							<Checkbox.Group options={platformOptions} disabled={aiCapabilityLoading} />
						</Form.Item>

						<Form.Item
							name="status"
							label={
								<span>
									<Icon icon="ph:info" size={14} className="mr-1 align-middle" />
									用户状态
								</span>
							}
							rules={[{ required: true }]}
						>
							<Radio.Group options={STATUS_OPTIONS} />
						</Form.Item>
					</>
				)}
			</Form>
		</Modal>
	);
}
