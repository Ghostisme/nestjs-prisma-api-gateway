import { Button, Cascader, Form, Input, Modal, Select } from "antd";
import type { FormInstance } from "antd/es/form";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { createSellingPoint, updateSellingPoint } from "@/api/directorAIAgent";
import car from "@/assets/images/directorAIAgent/car.png";
import { Icon } from "@/components/icon";
import { useModelSellingPoints } from "@/pages/directorAIAgent/generateScript/hooks";

export default ({ visible, data, onClose, onRefresh, getBrandSeriesContent }: Props) => {
	const {
		value,
		tags,
		$reset,
		brandOpts,
		brandCombinationOpts,
		onChangeBrandId,
		onChangeValue,
		onAddTag,
		onDeleteTag,
		onSetTag,
		brandId,
	} = useModelSellingPoints(true);
	const formRef = useRef<FormInstance | null>(null);
	const onFinish = async ({ brandCombination, ...params }: Record<string, any>) => {
		if (!tags.length) {
			return toast.error("请至少添加一个卖点");
		}
		const { id, brandId, subBrandId, seriesId, modelId } = data;
		if (id) {
			await updateSellingPoint(id, {
				brandId,
				brandCombination: [subBrandId, seriesId, modelId].filter(Boolean).join(","),
				tags,
			});
			toast.success("编辑成功");
		} else {
			await createSellingPoint({
				...(params as any),
				brandCombination: brandCombination.join(","),
				tags,
			});
			toast.success("添加成功");
		}
		onRefresh();
		onClose();
	};
	useEffect(() => {
		if (!visible) {
			onChangeBrandId(void 0);
			return $reset();
		}
		Object.keys(data).length && onSetTag(data.tags);
	}, [visible, data]);
	useEffect(() => {
		formRef.current?.setFieldsValue({ brandCombination: void 0 });
	}, [brandId]);
	return (
		<Modal
			open={visible}
			destroyOnHidden
			width={564}
			onCancel={onClose}
			title={data.id ? "编辑卖点" : "添加卖点"}
			onOk={() => formRef.current?.submit()}
		>
			<Form autoComplete={"off"} layout={"vertical"} onFinish={onFinish} ref={formRef}>
				{data.id ? (
					<div className={"mb-[15px] text-[15px] text-[#1D2129] flex items-center gap-[4px] font-semibold"}>
						<img src={car} alt="" className={"w-[24px]"} />
						{getBrandSeriesContent(data)}
					</div>
				) : (
					<div className={"flex gap-[8px]"}>
						<Form.Item label={"品牌/车系"} name={"brandId"} rules={[{ required: true, message: "品牌不能为空" }]}>
							<Select onChange={onChangeBrandId} options={brandOpts.value} placeholder={"请选择品牌"} />
						</Form.Item>
						<Form.Item
							name={"brandCombination"}
							rules={[{ required: true, message: "车系不能为空" }]}
							className={"flex-1"}
							style={{ paddingTop: "30px" }}
						>
							<Cascader options={brandCombinationOpts.value} placeholder={"请选择车系"} className={"w-[385px]!"} />
						</Form.Item>
					</div>
				)}
				<Form.Item label={"添加卖点"} required>
					<div className={"flex items-center gap-[8px]"}>
						<Input
							placeholder={"请输入车系卖点，点击回车添加"}
							showCount
							maxLength={100}
							value={value}
							onChange={onChangeValue}
							onPressEnter={onAddTag}
						/>
						<Button type={"primary"} onClick={onAddTag}>
							添加
						</Button>
					</div>
				</Form.Item>
				<div className={"flex flex-wrap gap-[8px] mt-[8px]"}>
					{tags.map((it, i) => (
						<div
							className={"bg-[#F8FAFF] rounded-[8px] p-[8px] flex items-center gap-[4px] text-[#4E5969] text-[12px]"}
							// biome-ignore lint/suspicious/noArrayIndexKey: tags may contain duplicates from legacy data, index is required for uniqueness
							key={`${it}-${i}`}
						>
							{it}
							<Icon
								icon={"mdi:remove"}
								size={12}
								color={"#86909C"}
								onClick={() => onDeleteTag(i)}
								className={"cursor-pointer "}
							/>
						</div>
					))}
				</div>
			</Form>
		</Modal>
	);
};

interface Props {
	visible: boolean;
	data: Record<string, any>;
	onClose(): void;
	onRefresh(): void;
	getBrandSeriesContent(record: Record<string, any>): string;
}
