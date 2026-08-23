import { App, Checkbox, Input, Modal, Radio, Space } from "antd";
import { type JSX, useCallback, useState } from "react";
import type { BannedWordCategory, RiskLevel } from "../../types";
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
			message.warning("请输入违禁词");
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
			message.success("添加成功");
			setWord("");
			onSuccess();
			onClose();
		} catch (error) {
			message.error(getApiErrorMessage(error, "添加失败"));
		} finally {
			setLoading(false);
		}
	}, [category, riskLevel, word, triggerMode, matchMode, message, onSuccess, onClose]);

	return (
		<Modal
			title="添加违禁词"
			open={open}
			onCancel={onClose}
			okText="确认添加"
			cancelText="关闭窗口"
			onOk={handleSubmit}
			confirmLoading={loading}
			width={600}
		>
			<div className="space-y-5 py-2">
				<div>
					<div className="text-sm font-medium text-[var(--foreground)] mb-2">请选择违禁词类型</div>
					<Radio.Group value={category} onChange={(e) => setCategory(e.target.value)}>
						<Space wrap>
							{CATEGORY_OPTIONS.map((cat) => (
								<Radio key={cat} value={cat}>
									{cat}
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
									{risk}
								</Radio>
							))}
						</Space>
					</Radio.Group>
				</div>

				<div>
					<div className="text-sm font-medium text-[var(--foreground)] mb-2">请输入违禁词</div>
					<Input placeholder="最多输入20个字符" value={word} onChange={(e) => setWord(e.target.value)} maxLength={20} />
				</div>

				<div>
					<div className="text-sm font-medium text-[var(--foreground)] mb-2">触发方式</div>
					<Checkbox.Group
						value={triggerMode}
						onChange={(val) => setTriggerMode(val as string[])}
						options={[
							{ label: "输入违禁", value: "input" },
							{ label: "输出违禁", value: "output" },
						]}
					/>
				</div>

				<div>
					<div className="text-sm font-medium text-[var(--foreground)] mb-2">匹配方式</div>
					<Checkbox.Group
						value={matchMode}
						onChange={(val) => setMatchMode(val as string[])}
						options={[
							{ label: "精确匹配", value: "exact" },
							{ label: "模糊匹配", value: "fuzzy" },
							{ label: "语义理解", value: "semantic" },
							{ label: "模型识别", value: "model" },
						]}
					/>
				</div>
			</div>
		</Modal>
	);
};
