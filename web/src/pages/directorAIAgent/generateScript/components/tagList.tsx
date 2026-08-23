import { cn } from "@/utils";

export default ({ data, max, value, onChange }: Props) => {
	const onClick = (i: number) => {
		const { value: v } = data[i];
		if (value.includes(v)) {
			return onChange(
				value.filter((it) => it !== v),
				data[i],
			);
		}
		if (max && value.length >= max) {
			return;
		}
		onChange([...value, v], data[i]);
	};
	return (
		<div className={"flex flex-wrap gap-[8px]"}>
			{data.map(({ label, value: v }, i) => {
				const bool = value.includes(v);
				return (
					<div
						key={v}
						className={cn(
							"p-[8px] bg-[#F8FAFF] rounded-[8px] text-[12px] text-[#4E5969] cursor-pointer",
							!bool && max && value.length >= max && "bg-[#EFEFEF] text-[#BFBFBF]",
							bool && "bg-[#165DFF1A] text-[#165DFF]",
						)}
						onClick={() => onClick(i)}
					>
						{label}
					</div>
				);
			})}
		</div>
	);
};

interface Props {
	data: Item[];
	max?: number;
	value: string[];
	onChange(value: string[], item: Item): void;
}
export interface Item {
	label: string;
	value: string;
}
