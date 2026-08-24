import { App, Button, Popconfirm } from "antd";
import { type JSX, useCallback, useMemo, useRef, useState } from "react";
import {
	// deletePartnerEnterprise,
	disablePartnerEnterprise,
	enablePartnerEnterprise,
	postPartnerEnterprisePage,
	type PageTenantPageVO,
	type TenantPageVO,
} from "@/api/partnerEnterpriseManagement";
import type { TableAction, TableConfig } from "@/components/table";
import ConfigTable from "@/components/table";
import { useAuthCheck } from "@/components/auth/use-auth";
import { getApiErrorMessage } from "@/utils/request-error";
import { LMX_ADMIN_PERMISSIONS } from "@/pages/rbac/permissions";
import { PARTNER_ENTERPRISE_USER_MODAL_MODE, type PartnerEnterpriseUserModalMode } from "./constants";
import PartnerFormModal from "./components/PartnerFormModal";
import PartnerUserFormModal from "./components/PartnerUserFormModal";
import PartnerUserPasswordResetModal from "./components/PartnerUserPasswordResetModal";

const STATUS_LABEL: Record<number, string> = {
	0: "Enabled",
	1: "Disabled",
};

const toOptionalNumber = (value: unknown): number | undefined => {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}

	if (typeof value === "string" && value.trim() !== "") {
		const parsedValue = Number(value);
		return Number.isFinite(parsedValue) ? parsedValue : undefined;
	}

	return undefined;
};

const transformPartnerEnterprisePage = (rawData: unknown) => {
	const pageData = rawData as PageTenantPageVO | undefined;
	const records = pageData?.records ?? [];

	return {
		list: records,
		total: pageData?.total ?? 0,
	};
};

const searchResponsive = {
	xs: {
		columns: 1,
		layout: "vertical",
		gap: 12,
		actionsPlacement: "bottom",
		actionsDirection: "horizontal",
	},
	md: {
		columns: 1,
		layout: "horizontal",
		actionsPlacement: "right",
		actionsDirection: "vertical",
	},
	lg: { columns: 2 },
	xl: { columns: 3 },
	xxl: { columns: 3 },
	xxxl: { columns: 4 },
} as const;

export default function PartnerEnterprisePage(): JSX.Element {
	const { message } = App.useApp();
	const { check } = useAuthCheck("permission");
	const tableActionRef = useRef<TableAction | null>(null);

	const [partnerFormOpen, setPartnerFormOpen] = useState(false);
	const [partnerFormMode, setPartnerFormMode] = useState<"create" | "edit" | "view">("create");
	const [editPartnerId, setEditPartnerId] = useState<number | null>(null);
	const [userFormOpen, setUserFormOpen] = useState(false);
	const [userFormMode, setUserFormMode] = useState<PartnerEnterpriseUserModalMode>(
		PARTNER_ENTERPRISE_USER_MODAL_MODE.CREATE,
	);
	const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);
	const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
	const [resetPasswordPartnerId, setResetPasswordPartnerId] = useState<number | null>(null);

	const actionButtonClassName = "h-auto whitespace-nowrap p-0";
	const actionGroupClassName = "flex flex-wrap items-center gap-x-1 gap-y-0.5";

	const handleFormSuccess = useCallback(() => {
		setPartnerFormOpen(false);
		tableActionRef.current?.reload({ resetPage: true });
	}, []);

	const handleUserFormSuccess = useCallback(() => {
		setUserFormOpen(false);
		tableActionRef.current?.reload();
	}, []);

	const handleView = useCallback((partnerId: number) => {
		setEditPartnerId(partnerId);
		setPartnerFormMode("view");
		setPartnerFormOpen(true);
	}, []);

	const handleEdit = useCallback((partnerId: number) => {
		setEditPartnerId(partnerId);
		setPartnerFormMode("edit");
		setPartnerFormOpen(true);
	}, []);

	const handleCreateAccount = useCallback((partnerId: number) => {
		setSelectedPartnerId(partnerId);
		setUserFormMode(PARTNER_ENTERPRISE_USER_MODAL_MODE.CREATE);
		setUserFormOpen(true);
	}, []);

	const handleViewAccount = useCallback((partnerId: number) => {
		setSelectedPartnerId(partnerId);
		setUserFormMode(PARTNER_ENTERPRISE_USER_MODAL_MODE.VIEW);
		setUserFormOpen(true);
	}, []);

	const handleEditAccount = useCallback((partnerId: number) => {
		setSelectedPartnerId(partnerId);
		setUserFormMode(PARTNER_ENTERPRISE_USER_MODAL_MODE.EDIT);
		setUserFormOpen(true);
	}, []);

	const handleOpenResetAccountPassword = useCallback((partnerId: number) => {
		setResetPasswordPartnerId(partnerId);
		setResetPasswordModalOpen(true);
	}, []);

	const handleEnable = useCallback(
		async (partnerId: number) => {
			try {
				await enablePartnerEnterprise(partnerId);
				message.success("Enabled successfully");
				tableActionRef.current?.reload();
			} catch (error) {
				message.error(getApiErrorMessage(error, "Failed to enable"));
			}
		},
		[message],
	);

	const handleDisable = useCallback(
		async (partnerId: number) => {
			try {
				await disablePartnerEnterprise(partnerId);
				message.success("Disabled successfully");
				tableActionRef.current?.reload();
			} catch (error) {
				message.error(getApiErrorMessage(error, "Failed to disable"));
			}
		},
		[message],
	);

	// const handleDelete = useCallback(
	// 	async (partnerId: number) => {
	// 		try {
	// 			await deletePartnerEnterprise(partnerId);
	// 			message.success("删除成功");
	// 			tableActionRef.current?.reload();
	// 		} catch {
	// 			message.error("删除失败");
	// 		}
	// 	},
	// 	[message],
	// );

	const getPageWithPagination = useCallback((params?: Record<string, unknown>) => {
		const { page, pageSize, brandId, name, status } = params ?? {};

		return postPartnerEnterprisePage({
			brandId: toOptionalNumber(brandId),
			name: typeof name === "string" ? name : undefined,
			status: toOptionalNumber(status),
			current: toOptionalNumber(page),
			size: toOptionalNumber(pageSize),
		});
	}, []);

	const dataSource = useMemo(
		() => ({
			api: getPageWithPagination,
			transform: transformPartnerEnterprisePage,
		}),
		[getPageWithPagination],
	);

	const columns = useMemo<TableConfig<TenantPageVO>["columns"]>(
		() => [
			{ title: "Partner ID", dataIndex: "id", width: 260 },
			{ title: "Partner Brand", dataIndex: "brandName", width: 140, ellipsis: true },
			{
				title: "Partner Name",
				dataIndex: "name",
				width: 260,
				ellipsis: true,
				tooltip: true,
			},
			{ title: "User Count", dataIndex: "userNumber", width: 130 },
			{
				title: "Status",
				dataIndex: "status",
				width: 100,
				render: (value: number) => STATUS_LABEL[value] ?? "-",
			},
			{ title: "Join Time", dataIndex: "joinTime", width: 180 },
			{
				title: "Account Actions",
				dataIndex: "accountActions",
				width: 450,
				fixed: "right",
				render: (_: unknown, record: TenantPageVO) => {
					const partnerId = record.id ?? 0;
					const enterpriseUserCount = toOptionalNumber(record.userNumber) ?? 0;
					const hasEnterpriseAccount = enterpriseUserCount >= 1;
					const canCreateEnterpriseAccount = check(LMX_ADMIN_PERMISSIONS.partner_createAccount);
					// 查看企业账号
					const canViewEnterpriseAccount = check(LMX_ADMIN_PERMISSIONS.partner_viewAccount);
					// 编辑企业账号
					const canEditEnterpriseAccount = check(LMX_ADMIN_PERMISSIONS.partner_updateAccount);
					// 重置企业账号密码
					const canResetEnterpriseAccountPassword = check(LMX_ADMIN_PERMISSIONS.partner_resetAccountPassword);

					// 业务规则：合作商用户数大于等于 1 时显示账号管理按钮，否则只显示创建企业账号按钮，两者互斥。
					if (!hasEnterpriseAccount) {
						if (!canCreateEnterpriseAccount) {
							return null;
						}

						return (
							<div className={actionGroupClassName}>
								<Button type="link" className={actionButtonClassName} onClick={() => handleCreateAccount(partnerId)}>
									Create Account
								</Button>
							</div>
						);
					}

					const actionNodes: JSX.Element[] = [];

					if (canViewEnterpriseAccount) {
						actionNodes.push(
							<Button
								key="view-enterprise-account"
								type="link"
								className={actionButtonClassName}
								onClick={() => handleViewAccount(partnerId)}
							>
								View Account
							</Button>,
						);
					}

					if (canEditEnterpriseAccount) {
						actionNodes.push(
							<Button
								key="edit-enterprise-account"
								type="link"
								className={actionButtonClassName}
								onClick={() => handleEditAccount(partnerId)}
							>
								Edit Account
							</Button>,
						);
					}

					if (canResetEnterpriseAccountPassword) {
						actionNodes.push(
							<Button
								key="reset-enterprise-account-password"
								type="link"
								className={actionButtonClassName}
								onClick={() => handleOpenResetAccountPassword(partnerId)}
							>
								Reset Password
							</Button>,
						);
					}

					if (actionNodes.length === 0) {
						return null;
					}

					return <div className={actionGroupClassName}>{actionNodes}</div>;
				},
			},
			{
				title: "Partner Actions",
				dataIndex: "partnerActions",
				width: 400,
				fixed: "right",
				render: (_: unknown, record: TenantPageVO) => {
					const partnerId = record.id ?? 0;
					const actionNodes: JSX.Element[] = [];

					if (check(LMX_ADMIN_PERMISSIONS.partner_read)) {
						actionNodes.push(
							<Button
								key="view-partner"
								type="link"
								className={actionButtonClassName}
								onClick={() => handleView(partnerId)}
							>
								View
							</Button>,
						);
					}

					if (check(LMX_ADMIN_PERMISSIONS.partner_update)) {
						actionNodes.push(
							<Button
								key="edit-partner"
								type="link"
								className={actionButtonClassName}
								onClick={() => handleEdit(partnerId)}
							>
								Edit
							</Button>,
						);
					}

					// if (check(LMX_ADMIN_PERMISSIONS.partner_delete)) {
					// 	actionNodes.push(
					// 		<Popconfirm key="delete-partner" title="确认删除该合作企业？" onConfirm={() => handleDelete(partnerId)}>
					// 			<Button
					// 				type="link"
					// 				danger
					// 				className={actionButtonClassName}
					// 				onClick={(event) => event.stopPropagation()}
					// 			>
					// 				删除合作企业
					// 			</Button>
					// 		</Popconfirm>,
					// 	);
					// }

					if (record.status === 0 && check(LMX_ADMIN_PERMISSIONS.partner_disabled)) {
						actionNodes.push(
							<Popconfirm key="disable-partner" title="Disable this partner enterprise?" onConfirm={() => handleDisable(partnerId)}>
								<Button
									type="link"
									danger
									className={actionButtonClassName}
									onClick={(event) => event.stopPropagation()}
								>
									Disable
								</Button>
							</Popconfirm>,
						);
					}

					if (record.status !== 0 && check(LMX_ADMIN_PERMISSIONS.partner_enabled)) {
						actionNodes.push(
							<Popconfirm key="enable-partner" title="Enable this partner enterprise?" onConfirm={() => handleEnable(partnerId)}>
								<Button type="link" className={actionButtonClassName} onClick={(event) => event.stopPropagation()}>
									Enable
								</Button>
							</Popconfirm>,
						);
					}

					if (actionNodes.length === 0) {
						return null;
					}

					return <div className={actionGroupClassName}>{actionNodes}</div>;
				},
			},
		],
		[
			handleCreateAccount,
			handleDisable,
			handleEdit,
			handleEditAccount,
			handleEnable,
			handleOpenResetAccountPassword,
			handleView,
			handleViewAccount,
			check,
		],
	);

	const tableConfig = useMemo<TableConfig<TenantPageVO>>(
		() => ({
			rowKey: "id",
			dataSource,
			toolbar: {
				align: "left",
				customActions: [
					{
						text: "Add Partner Enterprise",
						type: "primary",
						onClick: () => {
							setEditPartnerId(null);
							setPartnerFormMode("create");
							setPartnerFormOpen(true);
						},
					},
				],
			},
			scroll: { x: "max-content", y: 520 },
			sticky: true,
			zebra: true,
			bordered: true,
			paginationMode: "auto",
			search: {
				layout: "horizontal",
				showAdvanced: false,
				isButtonHorizontal: true,
				colSpan: 6,
				gap: 12,
				cacheKey: "partner-enterprise.search",
				responsive: { ...searchResponsive },
				fields: [
					{
						name: "brandId",
						label: "Partner Brand",
						type: "brandSelect",
						placeholder: "Select",
					},
					{
						name: "name",
						label: "Partner Name",
						type: "input",
						placeholder: "Enter…",
					},
					{
						name: "status",
						label: "Status",
						type: "select",
						placeholder: "Select",
						options: [
							{ label: "Enabled", value: 0 },
							{ label: "Disabled", value: 1 },
						],
					},
				],
			},
			columns,
			pagination: {
				showQuickJumper: false,
				showSizeChanger: false,
				showTotal: (total) => `${total} records`,
			},
		}),
		[dataSource, columns],
	);

	return (
		<>
			<ConfigTable config={tableConfig} actionRef={tableActionRef} />
			<PartnerFormModal
				open={partnerFormOpen}
				onOpenChange={setPartnerFormOpen}
				onSuccess={handleFormSuccess}
				mode={partnerFormMode}
				partnerId={editPartnerId}
			/>
			<PartnerUserFormModal
				open={userFormOpen}
				onOpenChange={setUserFormOpen}
				mode={userFormMode}
				partnerId={selectedPartnerId}
				onSuccess={handleUserFormSuccess}
			/>
			<PartnerUserPasswordResetModal
				open={resetPasswordModalOpen}
				onOpenChange={setResetPasswordModalOpen}
				partnerId={resetPasswordPartnerId}
			/>
		</>
	);
}
