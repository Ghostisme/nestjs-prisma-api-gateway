import { InputNumber, Modal, Radio, Space } from "antd";
import { type JSX, useCallback, useState } from "react";
import type { QuotaOperationType } from "../../types";

interface QuotaManageModalProps {
	open: boolean;
	onClose: () => void;
	userName: string;
	currentQuota: number;
	currentRemaining: number;
	onConfirm: (type: QuotaOperationType, value?: number) => void;
}

export const QuotaManageModal = ({
	open,
	onClose,
	currentQuota,
	currentRemaining,
	onConfirm,
}: QuotaManageModalProps): JSX.Element => {
	const [operationType, setOperationType] = useState<QuotaOperationType>("noChange");
	const [inputValue, setInputValue] = useState<number | null>(null);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [confirmMessage, setConfirmMessage] = useState("");

	const handleConfirmClick = useCallback(() => {
		const val = inputValue ?? 0;
		let newQuota: number | string;
		let message: string;

		switch (operationType) {
			case "increase":
				newQuota = currentQuota + val;
				message = `Total quota will change to ${newQuota}. Confirm?`;
				break;
			case "decrease":
				newQuota = currentQuota - val;
				message = `Total quota will change to ${newQuota}. Confirm?`;
				break;
			case "unlimited":
				newQuota = "Unlimited";
				message = `Total quota will change to <span style="color:red;font-weight:bold">Unlimited</span>. Confirm?`;
				break;
			default:
				return;
		}

		setConfirmMessage(message);
		setConfirmOpen(true);
	}, [operationType, inputValue, currentQuota]);

	const handleFinalConfirm = useCallback(() => {
		onConfirm(operationType, inputValue ?? undefined);
		setConfirmOpen(false);
		setOperationType("noChange");
		setInputValue(null);
		onClose();
	}, [operationType, inputValue, onConfirm, onClose]);

	const handleCancel = useCallback(() => {
		setOperationType("noChange");
		setInputValue(null);
		onClose();
	}, [onClose]);

	return (
		<>
			<Modal
				title="Manage Quota"
				open={open}
				onCancel={handleCancel}
				okText="Confirm"
				cancelText="Close"
				onOk={handleConfirmClick}
				okButtonProps={{ disabled: operationType === "noChange" }}
				width={500}
			>
				<div className="space-y-4 py-2">
					<div className="flex items-center justify-between">
						<span className="text-sm text-[var(--foreground)]">Current Total Quota</span>
						<span className="text-lg font-bold" style={{ color: "var(--colors-palette-primary-default)" }}>
							{currentQuota === -1 ? "∞" : currentQuota}
						</span>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-sm text-[var(--foreground)]">Current Remaining</span>
						<span className="text-lg font-bold" style={{ color: "var(--colors-palette-error-default)" }}>
							{currentRemaining}
						</span>
					</div>

					<div className="pt-2">
						<div className="text-sm text-[var(--foreground)] mb-2">Adjust Token Quota</div>
						<Radio.Group value={operationType} onChange={(e) => setOperationType(e.target.value)}>
							<Space direction="vertical">
								<Radio value="noChange">No Change</Radio>
								<Radio value="increase">
									<Space>
										Increase
										{operationType === "increase" && (
											<InputNumber
												placeholder="Enter quota"
												value={inputValue}
												onChange={(val) => setInputValue(val)}
												min={0}
												className="w-40"
											/>
										)}
									</Space>
								</Radio>
								<Radio value="decrease">
									<Space>
										Decrease
										{operationType === "decrease" && (
											<InputNumber
												placeholder="Enter quota"
												value={inputValue}
												onChange={(val) => setInputValue(val)}
												min={0}
												max={currentQuota}
												className="w-40"
											/>
										)}
									</Space>
								</Radio>
								<Radio value="unlimited">Unlimited</Radio>
							</Space>
						</Radio.Group>
					</div>
				</div>
			</Modal>

			<Modal
				title="Notice"
				open={confirmOpen}
				onCancel={() => setConfirmOpen(false)}
				okText="Confirm"
				cancelText="Close"
				onOk={handleFinalConfirm}
				width={420}
			>
				<p className="text-center py-4" dangerouslySetInnerHTML={{ __html: confirmMessage }} />
			</Modal>
		</>
	);
};
