import { Radio } from "antd";
import type { Item as It } from "@/pages/directorAIAgent/generateScript/components/tagList.tsx";
import { cn } from "@/utils";

export default ({ value, options, className, onChange, setItemClass }: Props) => (
	<Radio.Group
		value={value}
		onChange={({ target: { value } }) => onChange(value)}
		className={cn("grid! w-full grid-cols-2 md:grid-cols-3 gap-[8px]", className)}
	>
		{options.map(({ label, value, icon }, i) => (
			<Radio
				value={value}
				className={cn(
					"bg-[#F8FAFF] rounded-[8px] px-[16px]! py-[10px]! flex flex-row-reverse items-center! [&>.ant-radio-label]:flex-1",
					"[&.ant-radio-wrapper-checked]:bg-primary/10 [&.ant-radio-wrapper-checked]:border [&.ant-radio-wrapper-checked]:border-primary [&.ant-radio-wrapper-checked]:text-primary!",
					"hover:bg-primary/10 hover:text-primary!",
					setItemClass?.(i),
				)}
				key={value}
			>
				<div className={"flex items-center gap-[4px] whitespace-nowrap"}>
					{icon && <img src={icon} alt="" className={"w-[16px]"} />}
					{label}
				</div>
			</Radio>
		))}
	</Radio.Group>
);

interface Props {
	value: string;
	options: Item[];
	className?: string;
	onChange(value: string): void;
	setItemClass?(i: number): string;
}
interface Item extends It {
	icon?: string;
}
