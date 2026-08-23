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
				message = `该用户添加后Token总配额变更为${newQuota}, 是否确认？`;
				break;
			case "decrease":
				newQuota = currentQuota - val;
				message = `该用户减少后Token总配额变更为${newQuota}, 是否确认？`;
				break;
			case "unlimited":
				newQuota = "不限制配额";
				message = `该用户操作后Token总配额变更为<span style="color:red;font-weight:bold">不限制配额</span>, 是否确认？`;
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
				title="管理配额"
				open={open}
				onCancel={handleCancel}
				okText="确认添加"
				cancelText="关闭窗口"
				onOk={handleConfirmClick}
				okButtonProps={{ disabled: operationType === "noChange" }}
				width={500}
			>
				<div className="space-y-4 py-2">
					<div className="flex items-center justify-between">
						<span className="text-sm text-[var(--foreground)]">当前用户总配额</span>
						<span className="text-lg font-bold" style={{ color: "var(--colors-palette-primary-default)" }}>
							{currentQuota === -1 ? "∞" : currentQuota}
						</span>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-sm text-[var(--foreground)]">当前用户剩余配额</span>
						<span className="text-lg font-bold" style={{ color: "var(--colors-palette-error-default)" }}>
							{currentRemaining}
						</span>
					</div>

					<div className="pt-2">
						<div className="text-sm text-[var(--foreground)] mb-2">操作Token配额</div>
						<Radio.Group value={operationType} onChange={(e) => setOperationType(e.target.value)}>
							<Space direction="vertical">
								<Radio value="noChange">不更改配额</Radio>
								<Radio value="increase">
									<Space>
										修改序
										{operationType === "increase" && (
											<InputNumber
												placeholder="请输入配额"
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
										减少
										{operationType === "decrease" && (
											<InputNumber
												placeholder="请输入配额"
												value={inputValue}
												onChange={(val) => setInputValue(val)}
												min={0}
												max={currentQuota}
												className="w-40"
											/>
										)}
									</Space>
								</Radio>
								<Radio value="unlimited">不限制配额</Radio>
							</Space>
						</Radio.Group>
					</div>
				</div>
			</Modal>

			<Modal
				title="提示"
				open={confirmOpen}
				onCancel={() => setConfirmOpen(false)}
				okText="确认激活"
				cancelText="关闭窗口"
				onOk={handleFinalConfirm}
				width={420}
			>
				<p className="text-center py-4" dangerouslySetInnerHTML={{ __html: confirmMessage }} />
			</Modal>
		</>
	);
};
