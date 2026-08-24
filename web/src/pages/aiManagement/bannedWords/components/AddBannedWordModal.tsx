import { App, Checkbox, Input, Modal, Radio, Space } from "antd";
import { type JSX, useCallback, useState } from "react";
import { BANNED_WORD_CATEGORY_LABELS, type BannedWordCategory, type RiskLevel, RISK_LEVEL_LABELS } from "../../types";
import aiManagementService from "@/api/services/aiManagementService";
import { getApiErrorMessage } from "@/utils/request-error";

interface AddBannedWordModalProps {
	open: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

const CATEGORY_OPTIONS: BannedWordCategory[] = [
	"政治敏感",
	"暴力恐怖",
	"色情低俗",
	"商品违法",
	"虚假宣传",
	"歧视骚扰",
	"广告营销",
	"不良诱导",
	"隐私侵犯",
	"仇恨仇视",
	"其他类型",
];

const RISK_OPTIONS: RiskLevel[] = ["高风险", "中风险", "低风险"];

export const AddBannedWordModal = ({ open, onClose, onSuccess }: AddBannedWordModalProps): JSX.Element => {
	const { message } = App.useApp();
	const [category, setCategory] = useState<BannedWordCategory>("政治敏感");
	const [riskLevel, setRiskLevel] = useState<RiskLevel>("高风险");
	const [word, setWord] = useState("");
	const [triggerMode, setTriggerMode] = useState<string[]>(["input", "output"]);
	const [matchMode, setMatchMode] = useState<string[]>(["exact", "fuzzy", "semantic", "model"]);
	const [loading, setLoading] = useState(false);

	const handleSubmit = useCallback(async () => {
		if (!word.trim()) {
			message.warning("Please enter a banned word");
			return;
		}
		setLoading(true);
		try {
			await aiManagementService.addBannedWord({
				category,
				riskLevel,
				word: word.trim(),
				triggerMode,
				matchMode,
			});
			message.success("Added successfully");
			setWord("");
			onSuccess();
			onClose();
		} catch (error) {
			message.error(getApiErrorMessage(error, "Failed to add"));
		} finally {
			setLoading(false);
		}
	}, [category, riskLevel, word, triggerMode, matchMode, message, onSuccess, onClose]);

	return (
		<Modal
			title="Add Banned Word"
			open={open}
			onCancel={onClose}
			okText="Add"
			cancelText="Close"
			onOk={handleSubmit}
			confirmLoading={loading}
			width={600}
		>
			<div className="space-y-5 py-2">
				<div>
					<div className="text-sm font-medium text-[var(--foreground)] mb-2">Select category</div>
					<Radio.Group value={category} onChange={(e) => setCategory(e.target.value)}>
						<Space wrap>
							{CATEGORY_OPTIONS.map((cat) => (
								<Radio key={cat} value={cat}>
									{BANNED_WORD_CATEGORY_LABELS[cat] ?? cat}
								</Radio>
							))}
						</Space>
					</Radio.Group>
				</div>

				<div>
					<Radio.Group value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)}>
						<Space>
							{RISK_OPTIONS.map((risk) => (
								<Radio key={risk} value={risk}>
									{RISK_LEVEL_LABELS[risk] ?? risk}
								</Radio>
							))}
						</Space>
					</Radio.Group>
				</div>

				<div>
					<div className="text-sm font-medium text-[var(--foreground)] mb-2">Enter banned word</div>
					<Input placeholder="Up to 20 characters" value={word} onChange={(e) => setWord(e.target.value)} maxLength={20} />
				</div>

				<div>
					<div className="text-sm font-medium text-[var(--foreground)] mb-2">Trigger Mode</div>
					<Checkbox.Group
						value={triggerMode}
						onChange={(val) => setTriggerMode(val as string[])}
						options={[
							{ label: "Input", value: "input" },
							{ label: "Output", value: "output" },
						]}
					/>
				</div>

				<div>
					<div className="text-sm font-medium text-[var(--foreground)] mb-2">Match Mode</div>
					<Checkbox.Group
						value={matchMode}
						onChange={(val) => setMatchMode(val as string[])}
						options={[
							{ label: "Exact", value: "exact" },
							{ label: "Fuzzy", value: "fuzzy" },
							{ label: "Semantic", value: "semantic" },
							{ label: "Model", value: "model" },
						]}
					/>
				</div>
			</div>
		</Modal>
	);
};
