import { useImperativeHandle, useRef } from "react";
import { toast } from "sonner";
import { useReactive } from "@/hooks";
import { Card, TagList } from "./components";
import type { Props as P } from "./coreMission.tsx";

export default ({ max, ref }: Props) => {
	const options = [
		{ label: "日常通勤", value: "daily-commute" },
		{ label: "首次买车", value: "first-car" },
		{ label: "家庭用车", value: "family-car" },
		{ label: "考虑换车", value: "considering-trade-in" },
		{ label: "关注价格", value: "price-sensitive" },
		{ label: "考虑电车", value: "considering-ev" },
		{ label: "指定品牌", value: "specific-brand" },
		{ label: "商务需求", value: "business-need" },
		{ label: "线上了解", value: "online-research" },
		{ label: "暂不决定", value: "undecided" },
	];
	const { purchaseScenarios, $refs } = useReactive<State>({ purchaseScenarios: [] });
	const cardRef = useRef<HTMLDivElement | null>(null);
	useImperativeHandle(ref, () => ({
		validate() {
			return new Promise((resolve) => {
				if (!purchaseScenarios.length) {
					cardRef.current?.scrollIntoView({ behavior: "smooth" });
					return toast.error("请选择购车场景");
				}
				resolve(purchaseScenarios);
			});
		},
	}));
	return (
		<Card title={`购车场景（${purchaseScenarios.length}/${max}）`} ref={cardRef}>
			<TagList
				data={options.map(({ label }) => ({ label, value: label }))}
				max={max}
				value={purchaseScenarios}
				onChange={(value) => {
					$refs.purchaseScenarios = value;
				}}
			/>
		</Card>
	);
};

export interface Props extends P {
	max: number;
}
interface State {
	purchaseScenarios: string[];
}
