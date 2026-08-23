import { Cascader } from "antd";
import { useEffect, useMemo, useState } from "react";
import { getAreaTree } from "@/api/directorAIAgent";
import type { AreaTreeVO } from "@/api/directorAIAgent/types.ts";

export default ({ title, value, onChange }: Props) => {
	const [areaTree, setAreaTree] = useState<AreaTreeVO[]>([]);
	const [path, setPath] = useState<string[]>([]);
	const options = useMemo(() => formatAreaOptions(areaTree), [areaTree]);

	useEffect(() => {
		let canceled = false;
		const loadAreaTree = async () => {
			try {
				const data = await getAreaTree();
				if (canceled) {
					return;
				}
				setAreaTree(Array.isArray(data) ? data : []);
			} catch {
				if (!canceled) {
					setAreaTree([]);
				}
			}
		};
		loadAreaTree();
		return () => {
			canceled = true;
		};
	}, []);

	useEffect(() => {
		if (!value) {
			setPath([]);
		}
	}, [value]);

	return (
		<>
			<div className={"flex items-center text-[14px] text-[#4E5969] mt-[20px] mb-[8px]"}>{title}</div>
			<Cascader
				options={options}
				value={path}
				className={"!w-full"}
				allowClear
				placeholder={"请选择地域"}
				onChange={(selected) => {
					const values = (selected as string[]) || [];
					setPath(values);
					onChange(toCityRegion(values));
				}}
			/>
		</>
	);
};

interface Props {
	title: string;
	value: string;
	onChange(value: string): void;
}

interface AreaOption {
	label: string;
	value: string;
	children?: AreaOption[];
}

const formatAreaOptions = (list: AreaTreeVO[], level = 0): AreaOption[] =>
	list
		.filter((item) => item.name)
		.map((item) => ({
			label: item.name || "",
			value: item.name || "",
			// 只保留到市级 (level 0 是省，level 1 是市，level 2 是区)
			children: item.children?.length && level < 1 ? formatAreaOptions(item.children, level + 1) : undefined,
		}));

const toCityRegion = (values: string[] | undefined | null) => {
	if (!values || !values.length) {
		return "";
	}
	const [province, city] = values;
	return `${province || ""}${city || ""}`;
};
