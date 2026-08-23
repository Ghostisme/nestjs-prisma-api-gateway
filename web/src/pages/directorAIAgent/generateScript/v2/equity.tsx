import { Input, Modal } from "antd";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useReactive } from "@/hooks";
import { TagList } from "@/pages/directorAIAgent/generateScript/components";

import { type Item, PolicyOfferItem } from "@/pages/directorAIAgent/generateScript/preferentialPolicies.tsx";

export default ({ title: t, data, onChange }: Props) => {
	const options = [
		{ label: "零首付", value: "zero-down-payment" },
		{ label: "低首付", value: "low-down-payment" },
		{ label: "免息", value: "interest-free" },
		{ label: "低息", value: "low-interest" },
		{ label: "低月供", value: "low-monthly-payment" },
		{ label: "低日供", value: "low-daily-payment" },
		{ label: "置换补贴", value: "trade-in-subsidy" },
		{ label: "上市权益", value: "launch-benefits" },
		{ label: "综合权益", value: "comprehensive-benefits" },
		{ label: "现金优惠", value: "cash-discount" },
	];
	const { title, visible, value, record, i, $refs, $reset, $action } = useReactive<State>({
		title: "",
		visible: false,
		value: "",
		record: null,
		i: -1,
	});
	const tags = useMemo(() => data.map(({ value }) => value), [data]);
	const onChangeData = (value: string[], record: Item) => {
		const { label: title, value: v } = record;
		if (value.length < tags.length) {
			onChange(data.filter(({ value }) => value !== v));
			return;
		}
		if (title !== options[0].label && title !== options[2].label) {
			return $action({ title, visible: true, record });
		}
		let arr = data;
		if (title === options[0].label) {
			arr = arr.filter(({ value }) => value !== options[1].value);
		}
		if (title === options[2].label) {
			arr = arr.filter(({ value }) => value !== options[3].value);
		}
		onChange(arr.concat({ ...record, content: "-" }));
	};
	const onEdit = () => {
		data[i].content = value;
		$refs.visible = false;
	};
	const onConfirm = () => {
		if (!value) {
			return toast.error("请输入优惠内容");
		}
		if (~i) {
			return onEdit();
		}
		const { value: v } = record as Item;
		let arr = data;
		if (v === options[1].value) {
			arr = arr.filter(({ value }) => value !== options[0].value);
		}
		if (v === options[3].value) {
			arr = arr.filter(({ value }) => value !== options[2].value);
		}
		$refs.visible = false;
		onChange(arr.concat({ ...(record as Item), content: value }));
	};
	useEffect(() => {
		if (!visible) {
			$reset(["value", "title", "record", "i"]);
		}
	}, [visible]);
	return (
		<>
			<div className={"flex items-center text-[14px] text-[#4E5969]  mb-[8px]"}>{t}</div>
			<TagList data={options} value={tags} onChange={onChangeData} />
			{data.map((record, i) => {
				const { label: title, content: value } = record;
				return (
					<PolicyOfferItem
						{...record}
						index={i}
						key={title}
						options={options}
						onEdit={() => $action({ visible: true, record, title, value, i })}
						onDelete={() => {
							onChange(data.filter(({ label }) => label !== title));
						}}
					/>
				);
			})}
			<Modal
				title={title}
				open={visible}
				okText={"确定添加"}
				onOk={onConfirm}
				onCancel={() => {
					$refs.visible = false;
				}}
			>
				<Input
					placeholder={"请输入"}
					value={value}
					onChange={({ target: { value } }) => {
						$refs.value = value;
					}}
					onPressEnter={onConfirm}
				/>
			</Modal>
		</>
	);
};

interface Props {
	title: string;
	data: Item[];
	onChange(value: Item[]): void;
}
interface State {
	visible: boolean;
	title: string;
	value: string;
	record: Item | null;
	i: number;
}
