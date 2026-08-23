import { cn } from "@/utils";
import { Tooltip } from "antd";

export default ({ data = [], max = 3, onClick }: Props) => {
	const arr1 = data.slice(0, max);
	const arr2 = data.slice(max);
	return (
		<TagContent data={arr1} onClick={onClick}>
			{!!arr2.length && (
				<Tooltip
					title={
						<div className={"max-h-[200px] overflow-y-auto"}>
							<TagContent data={arr2} onClick={onClick} />
						</div>
					}
					color={"white"}
				>
					<div className={"bg-[#F5F5F5] rounded-[4px] px-[8px] py-[4px] text-[12px] text-[#4E5969]"}>
						+{arr2.length}...
					</div>
				</Tooltip>
			)}
		</TagContent>
	);
};
const TagContent = ({ data, onClick, children }: ContentProps) => (
	<div className={"flex flex-wrap gap-[8px]"}>
		{data.map(({ id, name }) => (
			<div
				className={cn(
					"bg-[#F5F5F5] rounded-[4px] px-[8px] py-[4px] text-[12px] text-[#4E5969]",
					onClick && "cursor-pointer",
				)}
				onClick={() => onClick?.(id)}
				key={id}
			>
				{name}
			</div>
		))}
		{children}
	</div>
);

interface Props {
	data: { id: string | number; name: string }[];
	max?: number;
	onClick?(id: string | number): void;
}
interface ContentProps extends Omit<Props, "max"> {
	children?: React.ReactNode;
}
