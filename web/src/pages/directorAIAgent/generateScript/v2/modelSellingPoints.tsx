import { Cascader, Select } from "antd";
import { useEffect, useImperativeHandle, useRef } from "react";
import { toast } from "sonner";
import { getSellingPointDetail } from "@/api/directorAIAgent";
import { useReactive } from "@/hooks";
import type { Props } from "../carBuyingScene.tsx";
import { Card } from "../components";
import { useModelSellingPoints } from "../hooks";
import { SellingPoint } from "./index.ts";

export default ({ max, ref }: Props) => {
	const {
		brandId,
		brandCombination,
		brandOpts,
		brandCombinationOpts,
		tags,
		onChangeBrandId,
		onChangeBrandCombination,
		onSetTag,
	} = useModelSellingPoints();
	const { sellingPointTags, $refs } = useReactive<State>({
		sellingPointTags: [],
	});
	const cardRef = useRef<HTMLDivElement | null>(null);
	const hasInitSeries = useRef(false);
	const seriesOpts = (brandCombinationOpts.value || []).map(({ label, value, children = [] }: any) => ({
		label,
		value,
		children: children.map(({ label, value }: any) => ({ label, value })),
	}));
	const normalizeBrandCombination = (value: unknown[] | undefined) => {
		if (!Array.isArray(value)) {
			return void 0;
		}
		const nextValue = value.filter((it): it is number => typeof it === "number").slice(0, 2);
		return nextValue.length === 2 ? nextValue : void 0;
	};

	const sceneOpts = {
		max,
		title: `卖点信息 (${sellingPointTags.length}/${max})`,
		data: sellingPointTags,
		defaultTags: tags.map((value) => ({ value, label: value })),
		onChange: (value: string[]) => {
			$refs.sellingPointTags = value;
		},
	};

	const getTagList = async () => {
		const currentBrandCombination = normalizeBrandCombination(brandCombination);
		if (!currentBrandCombination) {
			return;
		}
		try {
			const { tags = [] } = (await getSellingPointDetail(currentBrandCombination.join(","))) || {};
			onSetTag(tags);
			const firstTag = typeof tags?.[0] === "string" ? tags[0] : tags?.[0]?.name || "";
			$refs.sellingPointTags = firstTag ? [firstTag] : [];
		} catch {
			onSetTag([]);
			$refs.sellingPointTags = [];
		}
	};

	const handleChangeBrandId = (value: number | undefined) => {
		onChangeBrandCombination(void 0);
		onSetTag([]);
		$refs.sellingPointTags = [];
		onChangeBrandId(value);
	};
	const handleChangeBrandCombination = (value: number[]) => {
		onChangeBrandCombination(normalizeBrandCombination(value));
	};

	useEffect(() => {
		if (brandId === void 0 && brandOpts.value?.length) {
			onChangeBrandId(Number(brandOpts.value[0].value));
		}
	}, [brandId, brandOpts.value]);

	useEffect(() => {
		if (
			!hasInitSeries.current &&
			brandId !== void 0 &&
			(!brandCombination || brandCombination.length === 0) &&
			seriesOpts.length > 0
		) {
			const firstSubBrand = seriesOpts[0];
			if (firstSubBrand && firstSubBrand.children && firstSubBrand.children.length > 0) {
				const firstSeries = firstSubBrand.children[0];
				onChangeBrandCombination([firstSubBrand.value, firstSeries.value]);
				hasInitSeries.current = true;
			}
		}
	}, [brandId, brandCombination, seriesOpts]);

	useEffect(() => {
		if (normalizeBrandCombination(brandCombination)) {
			getTagList();
			return;
		}
		onSetTag([]);
		$refs.sellingPointTags = [];
	}, [brandCombination]);

	useImperativeHandle(ref, () => ({
		validate() {
			return new Promise((resolve) => {
				if (brandId === void 0) {
					cardRef.current?.scrollIntoView({ behavior: "smooth" });
					return toast.error("请选择品牌");
				}
				if (brandCombination && brandCombination.length !== 2) {
					cardRef.current?.scrollIntoView({ behavior: "smooth" });
					return toast.error("请选择车系");
				}
				if (!sellingPointTags.length) {
					cardRef.current?.scrollIntoView({ behavior: "smooth" });
					return toast.error("请至少添加一个卖点");
				}
				if (!brandCombination) {
					cardRef.current?.scrollIntoView({ behavior: "smooth" });
					return toast.error("请选择车系");
				}
				resolve({
					// brandId,
					// brandCombination: brandCombination.join(","),
					// sellingPointTags,
					brandId,
					subBrandId: brandCombination[0],
					seriesId: brandCombination[1],
					brandCombination: brandCombination.join(","),
					sellingPointTags,
				});
			});
		},
	}));
	return (
		<Card title={"基础信息"} description={""} ref={cardRef}>
			<div className={"text-[14px] text-[#4E5969] mb-[8px]"}>品牌/车系</div>
			<div className={"flex gap-[8px] mb-[20px]"}>
				<Select
					value={brandId}
					onChange={handleChangeBrandId}
					options={brandOpts.value}
					placeholder={"请选择品牌"}
					className={"w-[120px]"}
				/>
				<Cascader
					value={brandCombination}
					onChange={handleChangeBrandCombination}
					options={seriesOpts}
					placeholder={"请选择车系"}
					className={"flex-1"}
				/>
			</div>
			<SellingPoint {...sceneOpts} />
		</Card>
	);
};

interface State {
	sellingPointTags: string[];
}
