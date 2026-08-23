import { Button, Modal } from "antd";
import { useEffect, useState } from "react";
import WarningIcon from "@/assets/images/brand/library/WarningIcon.png";

interface OfflineConfirmModalProps {
	open: boolean;
	onCancel: () => void;
	onConfirm: () => Promise<void>;
	loading: boolean;
}

const OfflineConfirmModal: React.FC<OfflineConfirmModalProps> = ({
	open,
	onCancel,
	onConfirm,
	loading,
}: OfflineConfirmModalProps) => {
	const [step, setStep] = useState(1);

	useEffect(() => {
		if (open) {
			setStep(1);
		}
	}, [open]);

	const handleConfirm = () => {
		if (step === 1) {
			setStep(2);
		} else {
			onConfirm();
		}
	};

	return (
		<Modal
			open={open}
			onCancel={onCancel}
			footer={
				<div className="flex items-center gap-3">
					<Button className="flex-1" onClick={onCancel}>
						取消
					</Button>
					<Button
						className={`flex-1 transition-all duration-300 ${
							step === 2 ? "scale-105 font-bold shadow-lg shadow-red-500/30" : ""
						}`}
						type="primary"
						danger
						onClick={handleConfirm}
						loading={loading}
					>
						{step === 1 ? "确认删除 (1/2)" : "再次确认删除 (2/2)"}
					</Button>
				</div>
			}
			centered
			width={400}
		>
			<div className="flex flex-col items-center justify-center py-4">
				<img src={WarningIcon} alt="" />
				<div className="text-lg font-bold mb-2">确认要删除此品牌吗？</div>
				<div className="text-[14px] text-[#F53F3F] text-center leading-relaxed">
					{step === 1
						? "删除后，该品牌的所有关联信息将立即失效，且将进入最终不可逆确认环节。"
						: "一旦确认，该品牌将被永久删除且无法恢复，此操作不可逆。"}
				</div>
			</div>
		</Modal>
	);
};

export default OfflineConfirmModal;
