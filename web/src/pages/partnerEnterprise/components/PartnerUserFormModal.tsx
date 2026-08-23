import { Button, Form, Input, Modal, Radio, message } from "antd";
import { type JSX, useCallback, useEffect, useMemo, useState } from "react";
import {
	createPartnerEnterpriseUser,
	getPartnerEnterpriseUserDetail,
	updatePartnerEnterpriseUser,
} from "@/api/partnerEnterpriseManagement";
import Icon from "@/components/icon/icon";
import {
	PARTNER_ENTERPRISE_USER_MODAL_MODE,
	PARTNER_ENTERPRISE_USER_MODAL_TITLE_MAP,
	type PartnerEnterpriseUserModalMode,
} from "../constants";
import { getApiErrorMessage } from "@/utils/request-error";
import type { PartnerUserFormData } from "../types";

const PASSWORD_MIN_LEN = 8;
const PASSWORD_MAX_LEN = 15;
const PHONE_REG = /^1[3-9]\d{9}$/;
const USER_STATUS_OPTIONS = [
	{ label: "启用", value: 1 },
	{ label: "禁用", value: 0 },
];

const normalizeOptionalString = (value: string | undefined): string | undefined => {
	const trimmedValue = value?.trim();
	return trimmedValue ? trimmedValue : undefined;
};

interface PartnerUserFormModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	partnerId: number | null;
	mode?: PartnerEnterpriseUserModalMode;
	onSuccess?: () => void;
}

export default function PartnerUserFormModal({
	open,
	onOpenChange,
	partnerId,
	mode = PARTNER_ENTERPRISE_USER_MODAL_MODE.CREATE,
	onSuccess,
}: PartnerUserFormModalProps): JSX.Element {
	const [form] = Form.useForm<PartnerUserFormData>();
	const [loading, setLoading] = useState(false);
	const [detailLoading, setDetailLoading] = useState(false);
	const isCreateMode = mode === PARTNER_ENTERPRISE_USER_MODAL_MODE.CREATE;
	const isEditMode = mode === PARTNER_ENTERPRISE_USER_MODAL_MODE.EDIT;
	const isViewMode = mode === PARTNER_ENTERPRISE_USER_MODAL_MODE.VIEW;
	const modalTitle = useMemo(() => PARTNER_ENTERPRISE_USER_MODAL_TITLE_MAP[mode], [mode]);
	const resetModalState = useCallback(() => {
		form.resetFields();
		setLoading(false);
		setDetailLoading(false);
	}, [form]);
	const handleCloseModal = useCallback(() => {
		onOpenChange(false);
	}, [onOpenChange]);
	const handleAfterOpenChange = useCallback(
		(nextOpen: boolean) => {
			if (!nextOpen) {
				// 等弹窗完成关闭动画后再重置，避免用户看到表单内容被清空的过程。
				resetModalState();
			}
		},
		[resetModalState],
	);

	useEffect(() => {
		if (!open) {
			return;
		}

		if (partnerId === null) {
			form.resetFields();
			return;
		}

		if (isCreateMode) {
			form.resetFields();
			form.setFieldsValue({
				status: 1,
				tenantId: partnerId,
			});
			return;
		}

		let isMounted = true;

		const loadUserDetail = async (): Promise<void> => {
			try {
				setDetailLoading(true);
				const detail = await getPartnerEnterpriseUserDetail(partnerId);
				if (!isMounted) {
					return;
				}

				form.setFieldsValue({
					email: detail.email ?? "",
					name: detail.name ?? "",
					phone: detail.phone ?? "",
					status: detail.status ?? 1,
					tenantId: partnerId,
					username: detail.username ?? "",
				});
			} catch (error) {
				if (isMounted) {
					message.error(getApiErrorMessage(error, "获取企业账号详情失败"));
				}
			} finally {
				if (isMounted) {
					setDetailLoading(false);
				}
			}
		};

		void loadUserDetail();

		return () => {
			isMounted = false;
		};
	}, [form, isCreateMode, open, partnerId]);

	const handleOk = (): void => {
		if (detailLoading || isViewMode) {
			return;
		}
		form.submit();
	};

	const onFinish = async (values: PartnerUserFormData): Promise<void> => {
		if (partnerId === null) {
			message.error("缺少合作企业ID");
			return;
		}

		try {
			setLoading(true);
			if (isEditMode) {
				await updatePartnerEnterpriseUser({
					email: normalizeOptionalString(values.email),
					name: values.name.trim(),
					phone: values.phone?.trim() ?? "",
					status: values.status,
					tenantId: partnerId,
				});
				message.success("编辑企业账号成功");
			} else {
				await createPartnerEnterpriseUser({
					...values,
					email: normalizeOptionalString(values.email),
					name: values.name.trim(),
					phone: normalizeOptionalString(values.phone),
					username: values.username.trim(),
					tenantId: partnerId,
				});
				message.success("创建企业账号成功");
			}
			onOpenChange(false);
			onSuccess?.();
		} catch (error) {
			message.error(getApiErrorMessage(error, isEditMode ? "编辑企业账号失败" : "创建企业账号失败"));
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal
			title={modalTitle}
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
								关闭
							</Button>,
						]
					: [
							<Button key="cancel" onClick={handleCloseModal}>
								取消
							</Button>,
							<Button key="submit" type="primary" loading={loading} onClick={handleOk}>
								确认
							</Button>,
						]
			}
		>
			<Form
				form={form}
				layout="horizontal"
				labelCol={{ style: { width: 110, minWidth: 110 } }}
				onFinish={onFinish}
				autoComplete="off"
				initialValues={{ status: 1 }}
				disabled={isViewMode || detailLoading}
			>
				{detailLoading && !isCreateMode ? (
					<div className="py-8 text-center text-sm text-muted-foreground">加载中...</div>
				) : (
					<>
						<Form.Item name="tenantId" hidden>
							<Input />
						</Form.Item>

						<Form.Item
							name="username"
							label={
								<span>
									<Icon icon="ph:user" size={14} className="mr-1 align-middle" />
									用户名
								</span>
							}
							rules={[
								{ required: true, message: "请输入手机号" },
								{ pattern: PHONE_REG, message: "请输入正确的11位手机号码" },
							]}
						>
							<Input placeholder="请输入手机号" maxLength={11} showCount disabled={!isCreateMode} />
						</Form.Item>

						{isCreateMode ? (
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
										{ required: true, message: "请输入密码" },
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
										{ required: true, message: "请再次输入密码" },
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
						) : null}

						<Form.Item
							name="email"
							label={
								<span>
									<Icon icon="ph:envelope-simple" size={14} className="mr-1 align-middle" />
									联系邮箱
								</span>
							}
							rules={[{ type: "email", message: "请输入有效的邮箱地址" }]}
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
								{ required: isCreateMode, message: "请输入联系电话号码" },
								{
									validator(_, value) {
										if (!value || PHONE_REG.test(value)) {
											return Promise.resolve();
										}
										return Promise.reject(new Error("请输入正确的11位手机号码"));
									},
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
							label={
								<span>
									<Icon icon="ph:identification-badge" size={14} className="mr-1 align-middle" />
									选择角色
								</span>
							}
						>
							<Input value="超级管理员" disabled />
						</Form.Item>

						<Form.Item
							name="status"
							label={
								<span>
									<Icon icon="ph:info" size={14} className="mr-1 align-middle" />
									用户状态
								</span>
							}
							rules={[{ required: true, message: "请选择用户状态" }]}
						>
							<Radio.Group options={USER_STATUS_OPTIONS} />
						</Form.Item>
					</>
				)}
			</Form>
		</Modal>
	);
}
