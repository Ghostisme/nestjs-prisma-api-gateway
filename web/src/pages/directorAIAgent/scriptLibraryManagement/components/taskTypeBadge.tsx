import { useMemo } from "react";
import { SCRIPT_TYPE_ICON_MAP, ScriptType } from "@/pages/directorAIAgent/scriptLibraryManagement/const.ts";

export default ({ task }: Props) => {
	const opt = useMemo<Option | undefined>(() => {
		if (Array.isArray(task) && task.length) {
			const policy = task.find(({ type }) => type === ScriptType.POLICY_DETONATION);
			const product = task.find(({ type }) => type === ScriptType.PRODUCT_SEEDING);
			if (policy && product) {
				if (policy.factor > product.factor) {
					return {
						url: SCRIPT_TYPE_ICON_MAP[policy.type],
						label: "政策引爆",
						value: policy.factor,
					};
				}
				if (product.factor > policy.factor) {
					return {
						url: SCRIPT_TYPE_ICON_MAP[product.type],
						label: "产品种草 ",
						value: product.factor,
					};
				}
				if (product.factor === policy.factor) {
					return { label: "政策/种草", value: product.factor };
				}
			}
		}
	}, [task]);
	if (!opt) {
		return null;
	}
	return (
		<div
			className={
				"px-[4px] py-[2px] border border-[#F5F5F5] rounded-[4px] text-[12px] text-[#4E5969] flex items-center gap-[4px]"
			}
		>
			{opt.url && <img src={opt.url} alt="" className={"size-[16px] object-cover"} />}
			{opt.label}
			<span>{opt.value.toFixed(1)}</span>
		</div>
	);
};

interface Props {
	task: { type: ScriptType; factor: number }[];
}
interface Option {
	url?: string;
	label: string;
	value: number;
}
