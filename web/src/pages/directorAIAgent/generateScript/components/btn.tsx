import { Icon } from "@/components/icon";
import { cn } from "@/utils";
import { Card } from "./index.ts";
import star from "@/assets/images/directorAIAgent/star.png";

export default ({ isLoading, onSubmit }: Props) => (
	<Card>
		<div
			className={cn(
				"bg-[linear-gradient(90deg,#CEFFD9_4.81%,#24F3F3_30%,#35C3F8_60.1%,#4C84FE_100%)] py-[6px] rounded-[8px] text-[14px] text-[#FFFFFF] font-semibold flex items-center justify-center gap-[16px] cursor-pointer",
				isLoading && "opacity-[0.5]",
			)}
			onClick={onSubmit}
		>
			{isLoading && <Icon icon={"line-md:loading-loop"} size={16} color={"#FFFFFF"} />}
			<div className={"flex items-center justify-center gap-[4px]"}>
				<img src={star} alt="" className={"size-[16px] object-cover"} />
				AI生成创作脚本
			</div>
		</div>
	</Card>
);

interface Props {
	isLoading: boolean;
	onSubmit(): void;
}
