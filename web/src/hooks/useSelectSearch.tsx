import { Spin } from "antd";
import { useDebounce, useReactive } from "./index.ts";
import { useMount } from "react-use";

export default (fetcher: Fetcher, immediate = true) => {
	const { options, isLoading, $refs } = useReactive<State>({
		options: [],
		isLoading: false,
	});
	const onSearch = useDebounce(async (value: string) => {
		try {
			$refs.isLoading = true;
			$refs.options = await fetcher(value);
		} finally {
			$refs.isLoading = false;
		}
	});
	useMount(() => immediate && onSearch());
	return {
		options,
		props: {
			showSearch: { onSearch },
			notFoundContent: isLoading ? <Spin size="small" /> : "暂无数据",
		},
	};
};

type Fetcher = (value?: string) => Promise<Option[]>;
interface State {
	options: Option[];
	isLoading: boolean;
}
export interface Option {
	label: string;
	value: any;
}
