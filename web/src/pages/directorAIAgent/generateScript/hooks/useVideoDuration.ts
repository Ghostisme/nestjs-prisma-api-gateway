import { useReactive } from "@/hooks";

export default ({ title, defaultIndex = 0 }: Props) => {
	const options = [
		{ label: "20-35S", value: "20-35S" },
		{ label: "35-60S", value: "35-60S" },
		{ label: "60S以上", value: "60S以上" },
	];
	const { data, $refs } = useReactive({ data: options[defaultIndex].value });
	const onChange = (value: string) => {
		$refs.data = value;
	};
	return {
		title,
		data,
		options,
		onChange,
	};
};

interface Props {
	title: string;
	defaultIndex?: number;
}
