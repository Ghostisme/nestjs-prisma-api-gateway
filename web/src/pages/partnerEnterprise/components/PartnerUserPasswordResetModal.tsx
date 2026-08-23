import { App, Button, Input, Modal } from "antd";
import { type JSX, useCallback, useEffect, useState } from "react";
import { resetPartnerEnterpriseUserPassword } from "@/api/partnerEnterpriseManagement";
import { useCopyToClipboard } from "@/hooks";
import { getApiErrorMessage } from "@/utils/request-error";

interface PartnerUserPasswordResetModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	partnerId: number | null;
}

const parseResetPassword = (value: unknown): string | null => {
	const rawPassword =
		typeof value === "string"
			? value
			: typeof value === "object" && value !== null && "data" in value && typeof value.data === "string"
				? value.data
				: null;

	if (rawPassword === null) {
		return null;
	}

	const trimmedValue = rawPassword.trim();
	return trimmedValue || null;
};

export default function PartnerUserPasswordResetModal({
	open,
	onOpenChange,
	partnerId,
}: PartnerUserPasswordResetModalProps): JSX.Element {
	const { message } = App.useApp();
	const { copyFn } = useCopyToClipboard();
	const [loading, setLoading] = useState(false);
	const [nextPassword, setNextPassword] = useState<string | null>(null);
	const isPasswordReady = nextPassword !== null;

	useEffect(() => {
		if (open) {
			return;
		}

		setLoading(false);
		setNextPassword(null);
	}, [open]);

	const handleClose = useCallback(() => {
		if (loading) {
			return;
		}

		onOpenChange(false);
	}, [loading, onOpenChange]);

	const handleResetPassword = useCallback(async (): Promise<void> => {
		if (partnerId === null) {
			message.error("缺少合作企业ID");
			return;
		}

		try {
			setLoading(true);
			const response = await resetPartnerEnterpriseUserPassword(partnerId);
			const password = parseResetPassword(response);

			if (!password) {
				message.error("重置成功，但未获取到新密码");
				onOpenChange(false);
				return;
			}

			setNextPassword(password);
		} catch (error) {
			message.error(getApiErrorMessage(error, "重置企业账号密码失败"));
			onOpenChange(false);
		} finally {
			setLoading(false);
		}
	}, [message, onOpenChange, partnerId]);

	const handleCopyAndConfirm = useCallback(async (): Promise<void> => {
		if (!nextPassword) {
			return;
		}

		const copied = await copyFn(nextPassword, "新密码已复制");
		if (copied) {
			onOpenChange(false);
		}
	}, [copyFn, nextPassword, onOpenChange]);

	return (
		<Modal
			title="提示"
			open={open}
			onCancel={handleClose}
			width={520}
			destroyOnHidden
			maskClosable={!loading}
			closable={!loading}
			footer={
				isPasswordReady
					? [
							<Button key="copy-and-confirm" type="primary" onClick={() => void handleCopyAndConfirm()}>
								复制并确认
							</Button>,
						]
					: [
							<Button key="cancel" onClick={handleClose} disabled={loading}>
								取消
							</Button>,
							<Button key="confirm" type="primary" loading={loading} onClick={() => void handleResetPassword()}>
								确认
							</Button>,
						]
			}
		>
			{isPasswordReady ? (
				<div className="space-y-5 py-2">
					<div className="text-base font-medium text-foreground">账号新密码</div>
					<Input
						readOnly
						tabIndex={-1}
						value={nextPassword}
						className="h-14 text-[20px] font-semibold tracking-wide !shadow-none hover:!border-[#d9d9d9] focus:!border-[#d9d9d9] focus:!shadow-none"
					/>
					<div className="text-sm text-muted-foreground">请复制以上新密码并妥善保存。</div>
				</div>
			) : (
				<div className="py-6 text-base text-foreground">确认重置该账号密码吗？</div>
			)}
		</Modal>
	);
}
