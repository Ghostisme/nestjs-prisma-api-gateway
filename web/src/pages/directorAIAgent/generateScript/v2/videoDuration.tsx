import { Radio } from "../components";

export default ({ title, data, options, onChange }: Props) => (
	<>
		<div className={"flex items-center text-[14px] text-[#4E5969] mt-[20px] mb-[8px]"}>{title}</div>
		<Radio value={data} options={options} onChange={onChange} />
	</>
);

interface Props {
	title: string;
	data: string;
	options: { label: string; value: string }[];
	onChange(value: string): void;
}
