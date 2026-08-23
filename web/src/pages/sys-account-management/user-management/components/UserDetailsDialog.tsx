import { useQuery } from "@tanstack/react-query";
import { Modal } from "antd";
import type { ReactNode } from "react";
import userManagementService, { type UserDetails } from "@/api/services/userManagementService";
import { useAuthCheck } from "@/components/auth/use-auth";
import Icon from "@/components/icon/icon";
import { LMX_ADMIN_PERMISSIONS } from "@/pages/rbac/permissions";

interface DetailRowProps {
	icon: string;
	label: string;
	value: ReactNode;
}

function DetailRow({ icon, label, value }: DetailRowProps) {
	return (
		<div className="flex items-center justify-between gap-4 py-3 first:pt-0">
			<div className="flex min-w-0 items-center gap-2 text-muted-foreground">
				<Icon icon={icon} size={18} className="shrink-0" />
				<span className="text-sm">{label}</span>
			</div>
			<span className="truncate text-right text-sm text-foreground">{value ?? "-"}</span>
		</div>
	);
}

function DetailSeparator() {
	return <div className="border-border border-t" />;
}

interface UserDetailsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	userId: number | null;
}

const statuesMap: Record<number, string> = {
	0: "启用",
	1: "禁用",
};

export default function UserDetailsDialog({ open, onOpenChange, userId }: UserDetailsDialogProps) {
	// 查看弹窗与编辑弹窗保持同一权限口径，无部门权限时不展示所属部门信息。
	const { check } = useAuthCheck();
	const canViewDept = check(LMX_ADMIN_PERMISSIONS.dept_read);
	const { data, isPending, isError } = useQuery({
		queryKey: ["user-details", userId],
		queryFn: () => {
			if (userId === null) {
				throw new Error("缺少用户ID");
			}
			return userManagementService.getUserDetails(userId);
		},
		enabled: open && userId !== null,
	});

	const detail = data as UserDetails | undefined;

	return (
		<Modal title="查看用户" open={open} onCancel={() => onOpenChange(false)} footer={null} width={480} destroyOnHidden>
			{isPending && <div className="py-8 text-center text-sm text-muted-foreground">加载中...</div>}
			{isError && <div className="py-8 text-center text-sm text-destructive">加载失败，请重试</div>}
			{detail && !isPending && (
				<div className="mt-2">
					<DetailRow icon="ph:user" label="用户名" value={detail.username} />
					<DetailSeparator />
					<DetailRow icon="ph:envelope-simple" label="联系邮箱" value={detail.email} />
					<DetailSeparator />
					<DetailRow icon="ph:phone" label="联系电话" value={detail.phone} />
					<DetailSeparator />
					<DetailRow icon="ph:identification-card" label="姓名" value={detail.name} />
					<DetailSeparator />
					{/* <DetailRow icon="ph:identification-badge" label="所属角色" value={detail.roleName} /> */}
					<DetailRow
						icon="ph:identification-badge"
						label="所属角色"
						value={detail.roleName ?? detail.roleList.map((item) => item.roleName).join("、")}
					/>
					{canViewDept && (
						<>
							<DetailSeparator />
							<DetailRow
								icon="ph:buildings"
								label="所属部门"
								value={detail.deptName ?? detail.deptList.map((item) => item.deptName).join("、")}
							/>
						</>
					)}
					<DetailSeparator />
					<DetailRow icon="ph:info" label="用户状态" value={detail.statusName ?? statuesMap[detail.status]} />
				</div>
			)}
		</Modal>
	);
}
