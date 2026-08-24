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
			message.error("Partner enterprise ID is missing");
			return;
		}

		try {
			setLoading(true);
			const response = await resetPartnerEnterpriseUserPassword(partnerId);
			const password = parseResetPassword(response);

			if (!password) {
				message.error("Reset succeeded, but no new password was returned");
				onOpenChange(false);
				return;
			}

			setNextPassword(password);
		} catch (error) {
			message.error(getApiErrorMessage(error, "Failed to reset account password"));
			onOpenChange(false);
		} finally {
			setLoading(false);
		}
	}, [message, onOpenChange, partnerId]);

	const handleCopyAndConfirm = useCallback(async (): Promise<void> => {
		if (!nextPassword) {
			return;
		}

		const copied = await copyFn(nextPassword, "New password copied");
		if (copied) {
			onOpenChange(false);
		}
	}, [copyFn, nextPassword, onOpenChange]);

	return (
		<Modal
			title="Notice"
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
								Copy and Confirm
							</Button>,
						]
					: [
							<Button key="cancel" onClick={handleClose} disabled={loading}>
								Cancel
							</Button>,
							<Button key="confirm" type="primary" loading={loading} onClick={() => void handleResetPassword()}>
								OK
							</Button>,
						]
			}
		>
			{isPasswordReady ? (
				<div className="space-y-5 py-2">
					<div className="text-base font-medium text-foreground">New Account Password</div>
					<Input
						readOnly
						tabIndex={-1}
						value={nextPassword}
						className="h-14 text-[20px] font-semibold tracking-wide !shadow-none hover:!border-[#d9d9d9] focus:!border-[#d9d9d9] focus:!shadow-none"
					/>
					<div className="text-sm text-muted-foreground">Please copy the new password above and keep it safe.</div>
				</div>
			) : (
				<div className="py-6 text-base text-foreground">Reset this account's password?</div>
			)}
		</Modal>
	);
}
