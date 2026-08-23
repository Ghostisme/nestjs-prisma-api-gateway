export default ({ icon, title, description }: Props) => {
	return (
		<div className={"flex flex-col justify-center items-center h-full"}>
			<img src={icon} alt="" className={"w-[80px] mb-[16px]"} />
			{title && <div className={"text-[16px] text-[#1D2129] mb-[4px]"}>{title}</div>}
			{description && <div className={"text-[14px] text-[#86909C]"}>{description}</div>}
		</div>
	);
};

interface Props {
	icon: string;
	title?: string;
	description?: string;
}
