import { Input } from "antd";
import { useEffect, useImperativeHandle, useRef } from "react";
import { toast } from "sonner";
import { useReactive } from "@/hooks";
import type { Props } from "@/pages/directorAIAgent/generateScript/coreMission.tsx";
import { Card, Radio } from "./components";

export default ({ ref }: Props) => {
	const opts1 = [
		{ label: "利益/诱导", value: "利益/诱导" },
		{ label: "悬念/反转", value: "悬念/反转" },
		{ label: "对比/噱头/挑战", value: "对比/噱头/挑战" },
	];
	const opts2 = [
		{ label: "点下方链接", value: "点下方链接" },
		{ label: "点我头像", value: "点我头像" },
		{ label: "左滑视频", value: "左滑视频" },
		{ label: "其他", value: "其他" },
	];
	const { hookType, endingAction, endingActionDesc, $refs } = useReactive({
		hookType: opts1[0].value,
		endingAction: "",
		endingActionDesc: "",
	});
	const cardRef = useRef<HTMLDivElement | null>(null);
	useEffect(() => {
		if (endingAction !== opts2[3].value) {
			$refs.endingActionDesc = "";
		}
	}, [endingAction]);
	useImperativeHandle(ref, () => ({
		validate() {
			return new Promise((resolve) => {
				if (!endingAction) {
					cardRef.current?.scrollIntoView({ behavior: "smooth" });
					return toast.error("请选择结尾行动指令");
				}
				if (endingAction === opts2[3].value && !endingActionDesc) {
					cardRef.current?.scrollIntoView({ behavior: "smooth" });
					return toast.error("请输入自定义结尾行动指令");
				}
				resolve({ hookType, endingAction, endingActionDesc });
			});
		},
	}));
	return (
		<Card title={"钩子与结尾"} description={"决定第一秒怎么把人留住,不让他把视频划走。"} ref={cardRef}>
			<div className={"text-[14px] text-[#4E5969] mt-[20px] mb-[8px]"}>钩子</div>
			<Radio
				value={hookType}
				options={opts1}
				onChange={(value) => {
					$refs.hookType = value;
				}}
			/>
			<div className={"text-[14px] text-[#4E5969] mt-[20px] mb-[8px]"}>结尾行动指令</div>
			<Radio
				value={endingAction}
				options={opts2}
				onChange={(value) => {
					$refs.endingAction = value;
				}}
				className={"min-[1681px]:grid-cols-4"}
				setItemClass={(i) => (i === opts2.length - 1 ? "min-[1681px]:col-span-1 col-span-3" : "")}
			/>
			{endingAction === opts2[3].value && (
				<Input
					placeholder={"请输入 (必填)"}
					value={endingActionDesc}
					onChange={({ target: { value } }) => {
						$refs.endingActionDesc = value;
					}}
					className={"mt-[20px]!"}
				/>
			)}
		</Card>
	);
};
