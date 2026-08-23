import type { Props } from "@/pages/directorAIAgent/generateScript/coreMission.tsx";
import { useImperativeHandle } from "react";
import { Card, Radio } from "./components";
import { useReactive } from "@/hooks";

export default ({ ref }: Props) => {
	const options = [
		{ label: "20-35S", value: "20-35S" },
		{ label: "35-60S", value: "35-60S" },
		{ label: "60S以上", value: "60S以上" },
	];
	const { value, $refs } = useReactive({ value: options[1].value });
	useImperativeHandle(ref, () => ({
		validate() {
			return value;
		},
	}));
	return (
		<Card title={"视频时长"} description={"决定视频长短,短的刷脸抢眼,长的讲细政策。"}>
			<Radio
				value={value}
				options={options}
				onChange={(value) => {
					$refs.value = value;
				}}
			/>
		</Card>
	);
};
