import type React from "react";
import { Icon } from "@/components/icon";
import { Type } from "@/pages/directorAIAgent/generateScript/v2/const.ts";
import { cn } from "@/utils";
import { PRESENTATION_FORM_MAP } from "@/pages/directorAIAgent/scriptLibraryManagement/const.ts";

/* 卡片式 Tab 选择 */
interface Prop {
	tab: string;
	onChange: (value: string) => void;
}

const tabOptions = [
	{
		label: "真人口播",
		value: Type.RealOralBroadcast,
		icon: PRESENTATION_FORM_MAP.real_person.icon,
		bg: "bg-[#EFF6FF]",
		activeBg: "bg-[#DBEAFE]",
		activeColor: "text-[#3B82F6]",
		borderColor: "border-[#3B82F6]",
		iconColor: "#3B82F6",
		hoverBg: "hover:bg-[#DBEAFE]",
		hoverText: "hover:text-[#3B82F6]",
	},
	{
		label: "证言采访",
		value: Type.TestimonyInterview,
		icon: PRESENTATION_FORM_MAP.testimonial.icon,
		bg: "bg-[#F0FDF4]",
		activeBg: "bg-[#DCFCE7]",
		activeColor: "text-[#22C55E]",
		borderColor: "border-[#22C55E]",
		iconColor: "#22C55E",
		hoverBg: "hover:bg-[#DCFCE7]",
		hoverText: "hover:text-[#22C55E]",
	},
	{
		label: "剧情演绎",
		value: Type.PlotInterpretation,
		icon: PRESENTATION_FORM_MAP.drama.icon,
		bg: "bg-[#FFF7ED]",
		activeBg: "bg-[#FFEDD5]",
		activeColor: "text-[#F97316]",
		borderColor: "border-[#F97316]",
		iconColor: "#F97316",
		hoverBg: "hover:bg-[#FFEDD5]",
		hoverText: "hover:text-[#F97316]",
	},
	{
		label: "达人探店",
		value: Type.ExpertsVisitTheStore,
		icon: PRESENTATION_FORM_MAP["达人探店"].icon,
		bg: "bg-[#FDF2F8]",
		activeBg: "bg-[#FCE7F3]",
		activeColor: "text-[#EC4899]",
		borderColor: "border-[#EC4899]",
		iconColor: "#EC4899",
		hoverBg: "hover:bg-[#FCE7F3]",
		hoverText: "hover:text-[#EC4899]",
	},
	{
		label: "本地生活",
		value: Type.LocalLife,
		icon: PRESENTATION_FORM_MAP["本地生活"].icon,
		bg: "bg-[#FEFCE8]",
		activeBg: "bg-[#FEF9C3]",
		activeColor: "text-[#CA8A04]",
		borderColor: "border-[#CA8A04]",
		iconColor: "#CA8A04",
		hoverBg: "hover:bg-[#FEF9C3]",
		hoverText: "hover:text-[#CA8A04]",
	},
	{
		label: "原创人设",
		value: Type.OriginalPersona,
		icon: PRESENTATION_FORM_MAP["原创人设"].icon,
		bg: "bg-[#F5F3FF]",
		activeBg: "bg-[#EDE9FE]",
		activeColor: "text-[#8B5CF6]",
		borderColor: "border-[#8B5CF6]",
		iconColor: "#8B5CF6",
		hoverBg: "hover:bg-[#EDE9FE]",
		hoverText: "hover:text-[#8B5CF6]",
	},
];
const HorizontalCardTabs: React.FC<Prop> = ({ tab, onChange }) => {
	return (
		<div className="grid grid-cols-3 gap-[10px] mb-4">
			{tabOptions.map(
				({
					label,
					value,
					icon,
					bg,
					activeBg,
					activeColor,
					borderColor,
					// iconColor,
					hoverBg,
					hoverText,
				}) => {
					const isActive = tab === value;
					return (
						<div
							key={value}
							onClick={() => onChange(value)}
							className={cn(
								"flex flex-col items-center gap-[8px] px-[12px] py-[14px] rounded-[8px] cursor-pointer transition-all",
								"text-[#4E5969] text-[13px]",
								bg,
								hoverBg,
								hoverText,
								isActive && [activeBg, "border", borderColor, activeColor, "font-medium"],
							)}
						>
							<Icon
								icon={icon}
								size={22}
								// color={isActive ? iconColor : "#86909C"}
							/>
							{label}
						</div>
					);
				},
			)}
		</div>
	);
};

export default HorizontalCardTabs;
