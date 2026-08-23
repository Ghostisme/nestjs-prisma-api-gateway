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

	const title = scope === "node" ? "配置部门Token数" : "配置个人Token数";
	const footerTip = scope === "node" ? "将统一配置该部门下的成员Token数" : "将单独配置该成员Token数";

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
			okText="确认添加"
			cancelText="关闭窗口"
			confirmLoading={submitting}
			okButtonProps={{
				disabled: quotaMode === "custom" && (quota === null || quota <= 0),
			}}
			width={500}
			destroyOnHidden
		>
			<div className="space-y-4 py-2">
				<div className="flex items-center gap-2">
					<span className="text-sm text-[var(--foreground)] min-w-[80px]">目标</span>
					<span className="font-medium">{targetName}</span>
				</div>

				<div>
					<div className="text-sm text-[var(--foreground)] mb-2">操作Token配额</div>
					<Radio.Group value={quotaMode} onChange={(e) => setQuotaMode(e.target.value)}>
						<Space direction="vertical" size="middle">
							<Radio value="unlimited">不限制配额</Radio>
							<Radio value="custom">
								<Space>
									<Select
										value={period}
										onChange={(val) => setPeriod(val)}
										disabled={quotaMode !== "custom"}
										style={{ width: 110 }}
										options={[
											{ label: "当月", value: "month" },
											{ label: "当日", value: "day" },
											{ label: "按天", value: "custom" },
										]}
									/>
									<InputNumber
										placeholder="请输入配额数"
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
