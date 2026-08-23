import { useReactive } from "@/hooks";
import type { Item } from "@/pages/directorAIAgent/generateScript/preferentialPolicies.tsx";

export default (title: string) => {
	const { data, $refs } = useReactive<State>({ data: [] });
	const onChange = (value: Item[]) => {
		$refs.data = value;
	};
	return {
		title,
		data,
		onChange,
	};
};

interface State {
	data: Item[];
}
