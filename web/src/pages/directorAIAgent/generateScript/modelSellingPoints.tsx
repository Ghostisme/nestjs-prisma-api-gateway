import { Button, Cascader, Input, Select } from "antd";
import { useEffect, useImperativeHandle, useRef } from "react";
import { toast } from "sonner";
import { createSellingPoint, getSellingPointDetail } from "@/api/directorAIAgent";
import empty2 from "@/assets/images/directorAIAgent/empty2.png";
import { useReactive } from "@/hooks";
import type { Props } from "./carBuyingScene.tsx";
import { Card, Empty, TagList } from "./components";
import { useModelSellingPoints } from "./hooks";

export default ({ max, ref }: Props) => {
	const {
		brandId,
		brandCombination,
		brandOpts,
		brandCombinationOpts,
		value,
		tags,
		onChangeBrandId,
		onChangeBrandCombination,
		onChangeValue,
		onAddTag,
		onSetTag,
	} = useModelSellingPoints();
	const { sellingPointTags, $refs } = useReactive<State>({
		sellingPointTags: [],
	});
	const cardRef = useRef<HTMLDivElement | null>(null);
	const onAdd = async () => {
		if (!brandCombination) return;
		const value = await onAddTag();
		if (sellingPointTags.length < max) {
			const tags = sellingPointTags.concat(value);
			await createSellingPoint({
				brandId,
				brandCombination: brandCombination.join(","),
				tags,
			});
			toast.success("添加成功");
			$refs.sellingPointTags = tags;
		}
	};
	const getTagList = async () => {
		if (!brandCombination) return;
		const { tags = [] } = (await getSellingPointDetail(brandCombination.join(","))) || {};
		onSetTag(tags);
	};
	useEffect(() => {
		brandCombination?.length ? getTagList() : onSetTag([]);
		$refs.sellingPointTags = [];
	}, [brandCombination]);
	useImperativeHandle(ref, () => ({
		validate() {
			return new Promise((resolve) => {
				if (!brandId) {
					cardRef.current?.scrollIntoView({ behavior: "smooth" });
					return toast.error("请选择品牌");
				}
				if (brandCombination && !brandCombination.length) {
					cardRef.current?.scrollIntoView({ behavior: "smooth" });
					return toast.error("请选择车系/车型");
				}
				if (!sellingPointTags.length) {
					cardRef.current?.scrollIntoView({ behavior: "smooth" });
					return toast.error("请至少添加一个卖点");
				}
				if (!brandCombination) {
					cardRef.current?.scrollIntoView({ behavior: "smooth" });
					return toast.error("请选择车系/车型");
				}
				resolve({
					brandId,
					brandCombination: brandCombination.join(","),
					sellingPointTags,
				});
			});
		},
	}));
	return (
		<Card title={"车型卖点"} description={"填写车型名称并选择车型亮点,突出车辆核心优势。"} ref={cardRef}>
			<div className={"text-[14px] text-[#4E5969] mb-[8px]"}>品牌/车系/车型</div>
			<div className={"flex gap-[8px] mb-[20px]"}>
				<Select
					onChange={onChangeBrandId}
					options={brandOpts.value}
					placeholder={"请选择品牌"}
					className={"w-[120px]"}
				/>
				<Cascader
					value={brandCombination}
					onChange={onChangeBrandCombination}
					options={brandCombinationOpts.value}
					placeholder={"请选择车系/车型"}
					className={"flex-1"}
				/>
			</div>
			{brandCombination && (
				<>
					<div className={"text-[14px] text-[#4E5969] mb-[8px]"}>
						车型卖点 ({sellingPointTags.length}/{max})
					</div>
					<div className={"max-h-[135px] border border-[#F5F5F5] rounded-[8px] overflow-y-auto p-[14px] mb-[12px]"}>
						{tags.length ? (
							<TagList
								data={tags.map((label) => ({ label, value: label }))}
								max={max}
								value={sellingPointTags}
								onChange={(value) => {
									$refs.sellingPointTags = value;
								}}
							/>
						) : (
							<Empty icon={empty2} description={"该车型暂无对应卖点，请手动添加"} />
						)}
					</div>
					<div className={"flex items-center gap-[8px]"}>
						<Input
							placeholder={"请输入车型卖点，点击回车添加"}
							showCount
							maxLength={20}
							value={value}
							onChange={onChangeValue}
							onPressEnter={onAdd}
						/>
						<Button type={"primary"} onClick={onAdd}>
							选择并添加至卖点库
						</Button>
					</div>
				</>
			)}
		</Card>
	);
};

interface State {
	sellingPointTags: string[];
}
