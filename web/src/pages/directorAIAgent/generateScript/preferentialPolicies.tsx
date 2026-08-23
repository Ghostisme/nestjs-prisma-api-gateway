import { useSortable } from "@dnd-kit/react/sortable";
import { Button, Input, Modal, Popconfirm } from "antd";
import { useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { toast } from "sonner";
import { Icon } from "@/components/icon";
import { useReactive } from "@/hooks";
import type { Item as It } from "@/pages/directorAIAgent/generateScript/components/tagList.tsx";
import type { Props } from "@/pages/directorAIAgent/generateScript/coreMission.tsx";
import { Card, TagList } from "./components";

export default ({ ref }: Props) => {
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
	const { policyOffers, title, visible, value, record, i, $refs, $reset, $action } = useReactive<State>({
		policyOffers: [],
		title: "",
		visible: false,
		value: "",
		record: null,
		i: -1,
	});
	const tags = useMemo(() => policyOffers.map(({ value }) => value), [policyOffers]);
	const cardRef = useRef<HTMLDivElement | null>(null);
	const onChange = (value: string[], record: Item) => {
		const { label: title, value: v } = record;
		if (value.length < tags.length) {
			$refs.policyOffers = policyOffers.filter(({ value }) => value !== v);
			return;
		}
		if (title !== options[0].label && title !== options[2].label) {
			return $action({ title, visible: true, record });
		}
		let arr = policyOffers;
		if (title === options[0].label) {
			arr = arr.filter(({ value }) => value !== options[1].value);
		}
		if (title === options[2].label) {
			arr = arr.filter(({ value }) => value !== options[3].value);
		}
		$refs.policyOffers = arr.concat({ ...record, content: "-" });
	};
	const onConfirm = () => {
		if (!value) {
			return toast.error("请输入优惠内容");
		}
		if (~i) {
			return onEdit();
		}
		const { value: v } = record as Item;
		let arr = policyOffers;
		if (v === options[1].value) {
			arr = arr.filter(({ value }) => value !== options[0].value);
		}
		if (v === options[3].value) {
			arr = arr.filter(({ value }) => value !== options[2].value);
		}
		$action({
			visible: false,
			policyOffers: arr.concat({ ...(record as Item), content: value }),
		});
	};
	const onEdit = () => {
		$refs.policyOffers[i].content = value;
		$refs.visible = false;
	};
	useEffect(() => {
		if (!visible) {
			$reset(["value", "title", "record", "i"]);
		}
	}, [visible]);
	useImperativeHandle(ref, () => ({
		validate() {
			return new Promise((resolve) => {
				if (!policyOffers.length) {
					cardRef.current?.scrollIntoView({ behavior: "smooth" });
					return toast.error("请至少添加一个优惠政策");
				}
				resolve({ policyOffers: policyOffers.map(({ label: code, content: description }) => ({ code, description })) });
			});
		},
	}));
	return (
		<Card title={"优惠政策"} description={"决定给观众什么具体的省钱好处,这是视频的核心政策优惠。"} ref={cardRef}>
			<TagList data={options} value={tags} onChange={onChange} />
			<div className={"flex items-center gap-[4px] text-[14px] text-[#FF7D00] mt-[20px]"}>
				<Icon icon={"mingcute:warning-line"} size={12} color={"#FF7D00"} />
				拖拽调整优先级，排序越靠前，生成权重越高。
			</div>
			{policyOffers.map((record, i) => {
				const { label: title, content: value } = record;
				return (
					<PolicyOfferItem
						{...record}
						index={i}
						key={title}
						options={options}
						onEdit={() => $action({ visible: true, record, title, value, i })}
						onDelete={() => {
							$refs.policyOffers = policyOffers.filter(({ label }) => label !== title);
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
		</Card>
	);
};
export const PolicyOfferItem = ({ label: id, content, index, options, onDelete, onEdit }: PolicyOfferItemProps) => {
	const { ref } = useSortable({ id, index });
	return (
		<div className={"flex items-center gap-[12px] p-[16px] bg-[#F8FAFF] rounded-[8px] mt-[8px]"} ref={ref}>
			<Icon icon={"icon-park-outline:drag"} size={16} color={"#4E5969"} />
			<div className={"flex-1 text-[14px] text-[#4E5969] flex items-center gap-[8px]"}>
				<span className={"text-[#1D2129] font-semibold"}>{id}</span>
				<span className={"flex-1 break-all"}>{content}</span>
			</div>
			{id !== options[0].label && id !== options[2].label && (
				<Button type={"link"} onClick={onEdit} className={"p-0!"}>
					编辑
				</Button>
			)}
			<Popconfirm title={"确定删除此优惠政策吗？"} onConfirm={onDelete} okText={"确定删除"}>
				<Button type={"link"} danger className={"p-0!"}>
					删除
				</Button>
			</Popconfirm>
		</div>
	);
};

interface State {
	policyOffers: Item[];
	visible: boolean;
	title: string;
	value: string;
	record: Item | null;
	i: number;
}
export interface Item extends It {
	content: string;
}
interface PolicyOfferItemProps extends Item {
	index: number;
	options: It[];
	onDelete(): void;
	onEdit(): void;
}
