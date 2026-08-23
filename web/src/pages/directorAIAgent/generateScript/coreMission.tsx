import { InputNumber, Slider } from "antd";
import { type Ref, useImperativeHandle } from "react";
import association from "@/assets/images/directorAIAgent/association.png";
import policy_detonation from "@/assets/images/directorAIAgent/policy_detonation.png";
import product_seeding from "@/assets/images/directorAIAgent/product_seeding.png";
import { useReactive } from "@/hooks";
import { Card } from "./components";

export default ({ ref }: Props) => {
	const { taskType, $refs } = useReactive({
		taskType: [
			{ icon: policy_detonation, label: "政策引爆", factor: 0.5, type: "policy_detonation" },
			{ icon: product_seeding, label: "产品种草", factor: 0.5, type: "product_seeding" },
		],
	});
	const onChangeValue = (i: number, value: number) => {
		value = Number(value.toFixed(1));
		$refs.taskType.forEach((it, j) => {
			it.factor = j === i ? value : Number((1 - value).toFixed(1));
		});
	};
	useImperativeHandle(ref, () => ({
		validate() {
			return taskType.map(({ type, factor }) => ({ type, factor }));
		},
	}));
	return (
		<Card title={"核心任务"} description={"此选项将决定后续文案角度、钩子风格的推荐权重。"}>
			<div className={"flex items-center gap-[8px]"}>
				<img src={association} alt="" className={"w-[18px]"} />
				<div className={"flex flex-col gap-[8px] flex-1"}>
					{taskType.map(({ icon, label, factor }, i) => (
						<div className={"flex items-center gap-[12px]"} key={label}>
							<div className={"flex items-center gap-[4px] text-[14px] text-[#4E5969]"}>
								<img src={icon} alt="" className={"size-[16px] object-cover"} />
								{label}
							</div>
							<Slider
								value={factor}
								min={0}
								max={1}
								step={0.1}
								className={"flex-1"}
								onChange={(value) => onChangeValue(i, value)}
							/>
							<InputNumber
								min={0}
								max={1}
								step={0.1}
								value={factor}
								onChange={(value) => onChangeValue(i, Number(value))}
							/>
						</div>
					))}
				</div>
			</div>
		</Card>
	);
};

export interface Props {
	ref: Ref<any>;
}
