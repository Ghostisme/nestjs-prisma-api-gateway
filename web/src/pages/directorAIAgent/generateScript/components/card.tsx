import { Icon } from "@/components/icon";
import { useReactive } from "@/hooks";
import { cn } from "@/utils";
import type { Props as P } from "../coreMission.tsx";

export default ({ title, description, collapse, children, ref }: Props) => {
	const { flag, $refs } = useReactive({ flag: true });
	return (
		<div className={"bg-[#FFFFFF] rounded-[8px] p-[20px]"} ref={ref}>
			{title && (
				<div className={"text-[16px] text-[#1D2129] font-semibold flex items-center justify-between"}>
					{title}
					{collapse && (
						<Icon
							icon={!flag ? "teenyicons:up-solid" : "teenyicons:down-solid"}
							size={10}
							color={"#1D2129"}
							className={"cursor-pointer"}
							onClick={() => {
								$refs.flag = !flag;
							}}
						/>
					)}
				</div>
			)}
			{description && <div className={"text-[16px] text-[#86909C] mt-[4px]"}>{description}</div>}
			<div className={cn((title || description) && "mt-[20px]", !flag && "hidden")}>{children}</div>
		</div>
	);
};

interface Props extends Partial<P> {
	title?: string;
	description?: string;
	collapse?: boolean;
	children: React.ReactNode;
}
