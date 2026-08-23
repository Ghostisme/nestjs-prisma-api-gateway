import type { Option } from "@/hooks/useSelectSearch.tsx";
import { useState } from "react";
import { useMount } from "react-use";

export default ({ init, load, immediate = true }: Props) => {
	const [options, setOptions] = useState<ExOption[]>([]);
	const loadData = async (values: ExOption[]) => {
		const item = values[values.length - 1];
		if (!item.children) {
			item.children = setLeaf(await load(item.value));
			setOptions([...options]);
		}
	};
	const setLeaf = (arr?: ExOption[]) => {
		arr = arr || [];
		return arr.map(({ children, ...it }) => {
			children = setLeaf(children) as ExOption[];
			return { ...it, children, isLeaf: !children.length };
		});
	};
	useMount(async () => {
		if (immediate) {
			const res = await init();
			setOptions(res.map((it) => ({ ...it, isLeaf: false })));
		}
	});
	return {
		options,
		props: {
			changeOnSelect: false,
			loadData,
		},
	};
};

interface Props {
	init(): Promise<Option[]>;
	load(value: Option["value"]): Promise<ExOption[]>;
	immediate?: boolean;
}
export interface ExOption extends Option {
	children?: ExOption[];
	isLeaf?: boolean;
}
