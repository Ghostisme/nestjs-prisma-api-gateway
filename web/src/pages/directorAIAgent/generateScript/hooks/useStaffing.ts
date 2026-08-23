import { toast } from "sonner";
import { v4 as uuid } from "uuid";
import { useReactive } from "@/hooks";

export default ({ max, defaultRole = [] }: Props) => {
	const { data, $refs } = useReactive<State>({
		data: (defaultRole || []).map((item) => {
			const res = Object.entries(item).reduce(
				(obj, [k, v]) => {
					obj.role = k;
					obj.count = v;
					return obj;
				},
				{} as Record<string, any>,
			);
			return { ...res, uuid: uuid() };
		}) as State["data"],
	});
	const onAdd = () => {
		if (data.length >= max) {
			return toast.error(`最多添加${max}个人员配置`);
		}
		$refs.data.push({ role: "", count: 1, uuid: uuid() });
	};
	const onChange = (key: string, i: number, value: any) => {
		$refs.data[i][key as "role"] = value;
	};
	const onDelete = (i: number) => {
		$refs.data.splice(i, 1);
	};
	return {
		max,
		data,
		onAdd,
		onChange,
		onDelete,
	};
};

interface Props {
	max: number;
	defaultRole?: Record<string, any>[];
}
export interface State {
	data: { role: string; count: number; uuid: string }[];
}
