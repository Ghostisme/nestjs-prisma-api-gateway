import { Input, InputNumber, Switch } from "antd";
import { useEffect, useImperativeHandle, useRef } from "react";
import { toast } from "sonner";
import { v4 as uuid } from "uuid";
import drama from "@/assets/images/directorAIAgent/drama.png";
import real_person from "@/assets/images/directorAIAgent/real_person.png";
import testimonial from "@/assets/images/directorAIAgent/testimonial.png";
import { Icon } from "@/components/icon";
import { useReactive } from "@/hooks";
import type { Props } from "@/pages/directorAIAgent/generateScript/carBuyingScene.tsx";
import { Card, Radio, TagList } from "./components";

export default ({ max, ref }: Props) => {
	const options = [
		{ label: "真人口播", value: "真人口播", icon: real_person },
		{ label: "证言采访", value: "证言采访", icon: testimonial },
		{ label: "剧情演绎", value: "剧情演绎", icon: drama },
	];
	const { presentationForm, presentationRole, shootingLocation, hasHotspot, hotspotDescription, $refs } =
		useReactive<State>({
			presentationForm: options[0].value,
			presentationRole: [],
			shootingLocation: ["4s店"],
			hasHotspot: false,
			hotspotDescription: "",
		});
	const cardRef = useRef<HTMLDivElement | null>(null);
	const onAddPresentationRole = () => {
		if (presentationRole.length >= max) {
			return toast.error(`最多添加${max}个人员配置`);
		}
		$refs.presentationRole.push({ role: "", count: 1, uuid: uuid() });
	};
	const onChangePresentationRole = (key: string, i: number, value: any) => {
		$refs.presentationRole[i][key as "role"] = value;
	};
	const onDeletePresentationRole = (i: number) => {
		$refs.presentationRole.splice(i, 1);
	};
	const onChangeShootingLocation = (value: string[]) => {
		$refs.shootingLocation = value;
	};
	useEffect(() => {
		if (!hasHotspot) {
			$refs.hotspotDescription = "";
		}
	}, [hasHotspot]);
	useImperativeHandle(ref, () => ({
		validate() {
			return new Promise((resolve) => {
				if (presentationRole.some(({ role, count }) => !role || !count)) {
					cardRef.current?.scrollIntoView({ behavior: "smooth" });
					return toast.error("请填写完整的人员配置");
				}
				const arr = presentationRole.map(({ role }) => role);
				if (arr.length !== new Set(arr).size) {
					cardRef.current?.scrollIntoView({ behavior: "smooth" });
					return toast.error("人员配置的角色名不能重复");
				}
				resolve({
					presentationForm,
					presentationRole,
					shootingLocation,
					hasHotspot,
					hotspotDescription,
				});
			});
		},
	}));
	return (
		<Card title={"呈现形式"} description={"决定视频怎么拍,是真人说、画面剪、还是演个戏。"} ref={cardRef}>
			<div className={"text-[14px] text-[#4E5969] mb-[8px]"}>谁来讲</div>
			<Radio
				value={presentationForm}
				options={options}
				onChange={(value) => {
					$refs.presentationForm = value;
				}}
			/>
			<Staffing
				max={max}
				data={presentationRole}
				showTip={presentationForm === options[1].value}
				onAdd={onAddPresentationRole}
				onChange={onChangePresentationRole}
				onDelete={onDeletePresentationRole}
			/>
			<SellingPoint max={max} data={shootingLocation} onChange={onChangeShootingLocation} />
			<div className={"flex items-center justify-between mt-[20px] mb-[8px]"}>
				<div className={"flex items-center gap-[8px] text-[14px] text-[#4E5969]"}>
					有无热点
					<span className={"text-[12 px] text-[#86909C]"}>(选填)</span>
				</div>
				<Switch
					checked={hasHotspot}
					onChange={(value) => {
						$refs.hasHotspot = value;
					}}
				/>
			</div>
			{hasHotspot && (
				<Input
					placeholder={"请输入热点描述"}
					showCount
					maxLength={100}
					value={hotspotDescription}
					onChange={({ target: { value } }) => {
						$refs.hotspotDescription = value;
					}}
				/>
			)}
		</Card>
	);
};
const Staffing = ({ max = 5, data, showTip, onAdd, onChange, onDelete }: StaffingProps) => (
	<>
		<div className={"flex items-center mt-[20px] mb-[8px]"}>
			<div className={"flex-1 flex items-center gap-[8px] text-[14px] text-[#4E5969]"}>
				人员配置
				<span className={"text-[12px] text-[#86909C]"}>(选填)</span>
				{showTip && (
					<span className={"text-[12px] text-[#86909C] flex-1"}>
						证言采访：选择1人 默认为车主自述。选择2人为对话。例：销售A 车主B
					</span>
				)}
			</div>
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
const SellingPoint = ({ max, data, onChange }: SellingPointProps) => {
	const { value, tags, $refs } = useReactive<SellingPointState>({
		value: "",
		tags: ["4s店", "停车场"],
	});
	const onAdd = () => {
		if (!value) {
			return toast.error("请输入在哪拍");
		}
		if (tags.includes(value)) {
			return toast.error("不能添加重复标签");
		}
		$refs.tags.push(value);
		$refs.value = "";
		data.length < max && onChange(data.concat(value));
	};
	return (
		<>
			<div className={"flex items-center gap-[8px] text-[14px] text-[#4E5969] mt-[20px] mb-[8px]"}>
				在哪拍
				<span className={"text-[12 px] text-[#86909C]"}>(选填)</span>
			</div>
			<TagList data={tags.map((value) => ({ label: value, value }))} max={max} value={data} onChange={onChange} />
			<Input
				placeholder={"请输入在哪拍，按回车新增"}
				showCount
				maxLength={20}
				value={value}
				onChange={({ target: { value } }) => {
					$refs.value = value;
				}}
				onPressEnter={onAdd}
				className={"mt-[8px]"}
			/>
		</>
	);
};

interface State {
	presentationForm: string;
	presentationRole: { role: string; count: number; uuid: string }[];
	shootingLocation: string[];
	hasHotspot: boolean;
	hotspotDescription: string;
}
interface StaffingProps {
	max: number;
	data: State["presentationRole"];
	showTip: boolean;
	onAdd(): void;
	onChange(key: keyof State["presentationRole"][number], i: number, value: any): void;
	onDelete(i: number): void;
}
interface SellingPointProps {
	max: number;
	data: string[];
	onChange(value: string[]): void;
}
interface SellingPointState {
	value: string;
	tags: string[];
}
