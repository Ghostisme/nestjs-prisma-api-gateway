import { useReactive } from "@/hooks";

export default ({ defaultValue = [], defaultTags = [], ...props }: Props) => {
	const { value, $refs } = useReactive({ value: defaultValue });

	const onChange = (value: string[]) => {
		$refs.value = value;
	};
	return {
		...props,
		defaultTags,
		data: value,
		onChange,
	};
};

interface Props {
	max: number;
	title: string;
	defaultValue?: string[];
	defaultTags?: { label: string; value: string }[];
}
