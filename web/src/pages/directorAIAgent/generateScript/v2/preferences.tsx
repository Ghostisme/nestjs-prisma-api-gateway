// import { InputNumber, Slider } from "antd";
// import association from "@/assets/images/directorAIAgent/association.png";
import { Slider } from "antd";
import type { State } from "@/pages/directorAIAgent/generateScript/hooks/usePreferences.ts";

export default ({ title, data, onChange }: Props) => {
	const [policy, product] = data;
	return (
		<>
			<div className="text-[14px] text-[#4E5969] mt-[20px] mb-[8px]">{title}</div>
			<div className="flex items-center gap-[12px]">
				<div className="flex items-center gap-[4px] text-[13px] text-[#4E5969] whitespace-nowrap">
					<img src={policy.icon} alt="" className="size-[16px] object-cover" />
					{policy.label}
				</div>
				<span className="text-[13px] text-[#4E5969] min-w-[24px] text-right">{policy.factor?.toFixed(1)}</span>
				<Slider
					value={policy.factor}
					min={0}
					max={1}
					step={0.1}
					className="flex-1"
					styles={{
						rail: { backgroundColor: "#52c41a" }, // 绿色底轨
					}}
					onChange={(value) => onChange(0, value)}
				/>
				<span className="text-[13px] text-[#4E5969] min-w-[24px]">{product.factor?.toFixed(1)}</span>
				<div className="flex items-center gap-[4px] text-[13px] text-[#4E5969] whitespace-nowrap">
					<img src={product.icon} alt="" className="size-[16px] object-cover" />
					{product.label}
				</div>
			</div>
		</>
		// <>
		//   <div
		//     className={
		//       "flex items-center text-[14px] text-[#4E5969] mt-[20px] mb-[8px]"
		//     }
		//   >
		//     {title}
		//   </div>
		//   <div className={"flex items-center gap-[8px]"}>
		//     <img src={association} alt="" className={"w-[18px]"} />
		//     <div className={"flex flex-col gap-[8px] flex-1"}>
		//       {data.map(({ icon, label, factor }, i) => (
		//         <div className={"flex items-center gap-[12px]"} key={label}>
		//           <div
		//             className={
		//               "flex items-center gap-[4px] text-[14px] text-[#4E5969]"
		//             }
		//           >
		//             <img src={icon} alt="" className={"size-[16px] object-cover"} />
		//             {label}
		//           </div>
		//           <Slider
		//             value={factor}
		//             min={0}
		//             max={1}
		//             step={0.1}
		//             className={"flex-1"}
		//             onChange={(value) => onChange(i, value)}
		//           />
		//           <InputNumber
		//             min={0}
		//             max={1}
		//             step={0.1}
		//             value={factor}
		//             onChange={(value) => onChange(i, Number(value))}
		//           />
		//         </div>
		//       ))}
		//     </div>
		//   </div>
		// </>
	);
};

interface Props {
	title: string;
	data: State["data"];
	onChange(i: number, value: number): void;
}
