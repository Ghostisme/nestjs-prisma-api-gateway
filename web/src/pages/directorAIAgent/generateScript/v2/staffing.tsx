import { Input, InputNumber } from "antd";
import { Icon } from "@/components/icon";
import type { State } from "../hooks/useStaffing.ts";

export default ({ max = 5, data, onAdd, onChange, onDelete }: Props) => (
	<>
		<div className={"flex items-center justify-between mt-[20px] mb-[8px]"}>
			<div className={"text-[14px] text-[#4E5969]"}>人员配置</div>
			<div className={"flex items-center gap-[8px] text-[14px] text-[#165DFF] cursor-pointer"} onClick={onAdd}>
				<Icon icon={"material-symbols:add"} size={16} color={"#165DFF"} />
				添加 ({data.length}/{max})
			</div>
		</div>
		<div className={"flex flex-col gap-[8px]"}>
			{data.map(({ role, count, uuid }, i) => (
				<div className={"flex items-center gap-[8px]"} key={uuid}>
					<Input
						placeholder={"输入角色名"}
						showCount
						maxLength={20}
						value={role}
						onChange={({ target: { value } }) => onChange("role", i, value)}
					/>
					<InputNumber min={1} max={6} value={count} onChange={(value) => onChange("count", i, Number(value))} />
					<Icon
						icon={"material-symbols:delete-outline"}
						size={20}
						color={"#BBBBBB"}
						className={"cursor-pointer"}
						onClick={() => onDelete(i)}
					/>
				</div>
			))}
		</div>
	</>
);

interface Props {
	max: number;
	data: State["data"];
	onAdd(): void;
	onChange(key: keyof State["data"][number], i: number, value: any): void;
	onDelete(i: number): void;
}
