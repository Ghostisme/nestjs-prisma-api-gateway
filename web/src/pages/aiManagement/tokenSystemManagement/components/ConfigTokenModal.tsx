import { InputNumber, Modal, Radio, Select, Space } from "antd";
import { type JSX, useCallback, useEffect, useState } from "react";
import type { TokenConfigPayload } from "../../types";

interface ConfigTokenModalProps {
	open: boolean;
	/** 配置范围：node=部门级别，member=个人级别 */
	scope: "node" | "member";
	/** 目标名称（部门名或成员名） */
	targetName: string;
	onClose: () => void;
	onConfirm: (payload: TokenConfigPayload) => void | Promise<void>;
}

type QuotaMode = "unlimited" | "custom";

export const ConfigTokenModal = ({
	open,
	scope,
	targetName,
	onClose,
	onConfirm,
}: ConfigTokenModalProps): JSX.Element => {
	const [quotaMode, setQuotaMode] = useState<QuotaMode>("custom");
	const [period, setPeriod] = useState<"month" | "day" | "custom">("month");
	const [quota, setQuota] = useState<number | null>(null);
	const [submitting, setSubmitting] = useState<boolean>(false);

	useEffect(() => {
		if (open) {
			setQuotaMode("custom");
			setPeriod("month");
			setQuota(null);
		}
	}, [open]);

	const title = scope === "node" ? "Configure Dept Tokens" : "Configure Member Tokens";
	const footerTip =
		scope === "node" ? "This will apply the token quota to all members of the department" : "This will configure the token quota for this member only";

	const handleOk = useCallback(async (): Promise<void> => {
		const payload: TokenConfigPayload = {
			unlimited: quotaMode === "unlimited",
			quota: quotaMode === "custom" ? (quota ?? 0) : undefined,
			period: quotaMode === "custom" ? period : undefined,
		};
		try {
			setSubmitting(true);
			await onConfirm(payload);
		} finally {
			setSubmitting(false);
		}
	}, [quotaMode, quota, period, onConfirm]);

	return (
		<Modal
			title={title}
			open={open}
			onCancel={onClose}
			onOk={handleOk}
			okText="Confirm"
			cancelText="Close"
			confirmLoading={submitting}
			okButtonProps={{
				disabled: quotaMode === "custom" && (quota === null || quota <= 0),
			}}
			width={500}
			destroyOnHidden
		>
			<div className="space-y-4 py-2">
				<div className="flex items-center gap-2">
					<span className="text-sm text-[var(--foreground)] min-w-[80px]">Target</span>
					<span className="font-medium">{targetName}</span>
				</div>

				<div>
					<div className="text-sm text-[var(--foreground)] mb-2">Token Quota</div>
					<Radio.Group value={quotaMode} onChange={(e) => setQuotaMode(e.target.value)}>
						<Space direction="vertical" size="middle">
							<Radio value="unlimited">Unlimited quota</Radio>
							<Radio value="custom">
								<Space>
									<Select
										value={period}
										onChange={(val) => setPeriod(val)}
										disabled={quotaMode !== "custom"}
										style={{ width: 110 }}
										options={[
											{ label: "This Month", value: "month" },
											{ label: "Today", value: "day" },
											{ label: "Per Day", value: "custom" },
										]}
									/>
									<InputNumber
										placeholder="Enter quota"
										value={quota}
										onChange={(val) => setQuota(val)}
										disabled={quotaMode !== "custom"}
										min={0}
										style={{ width: 180 }}
									/>
								</Space>
							</Radio>
						</Space>
					</Radio.Group>
				</div>

				<div className="text-xs text-[var(--muted-foreground)] pt-2">{footerTip}</div>
			</div>
		</Modal>
	);
};
