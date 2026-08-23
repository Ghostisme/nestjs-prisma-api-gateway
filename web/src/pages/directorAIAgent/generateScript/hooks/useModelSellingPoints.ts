import type { ChangeEvent } from "react";
import { useAsync } from "react-use";
import { toast } from "sonner";
import { getBrand, getBrandSeriesModel } from "@/api/directorAIAgent";
import { useReactive } from "@/hooks";

export default (optsRule: boolean = false) => {
	const { brandId, brandCombination, value, tags, $refs, $reset } = useReactive<State>({
		brandId: void 0,
		brandCombination: void 0,
		value: "",
		tags: [],
	});
	const brandOpts = useAsync(async () => {
		const res = await getBrand();
		return res.map(({ brandId: value, brandName: label }) => ({ label, value }));
	}, []);
	const brandCombinationOpts = useAsync(async () => {
		onChangeBrandCombination(void 0);
		if (!brandId) {
			return [];
		}
		const res = await getBrandSeriesModel(brandId);
		return res.map(({ subBrandName: label, subBrandId: value, seriesList }) => {
			seriesList = seriesList || [];
			return {
				label,
				value,
				children: seriesList.map(({ seriesId: value, seriesName: label, carModels }) => {
					carModels = carModels || [];
					return {
						label,
						value,
						children: carModels.map(({ carId: value, carName: label, disabled }) => ({
							label,
							value,
							disabled: optsRule ? disabled : false,
						})),
					};
				}),
			};
		});
	}, [brandId]);
	const onChangeBrandId = (value: number | undefined) => {
		$refs.brandId = value;
	};
	const onChangeBrandCombination = (value: number[] | undefined) => {
		$refs.brandCombination = value;
	};
	const onChangeValue = ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
		$refs.value = value;
	};
	const onAddTag = () =>
		new Promise<string>((resolve) => {
			const trimValue = value.trim();
			if (!trimValue) {
				return toast.error("请输入车型卖点");
			}
			if (tags.includes(trimValue)) {
				return toast.error("不能添加重复标签");
			}
			$refs.tags.push(trimValue);
			$refs.value = "";
			resolve(trimValue);
		});
	const onDeleteTag = (i: number) => $refs.tags.splice(i, 1);
	const onSetTag = (arr: any[]) => {
		const newTags = arr.map((item) => (typeof item === "string" ? item : item?.name)).filter(Boolean);
		$refs.tags = Array.from(new Set(newTags));
	};
	return {
		brandId,
		brandCombination,
		value,
		tags,
		$reset,
		brandOpts,
		brandCombinationOpts,
		onChangeBrandId,
		onChangeBrandCombination,
		onChangeValue,
		onAddTag,
		onDeleteTag,
		onSetTag,
	};
};

interface State {
	brandId: number | undefined;
	brandCombination: number[] | undefined;
	value: string;
	tags: string[];
}
