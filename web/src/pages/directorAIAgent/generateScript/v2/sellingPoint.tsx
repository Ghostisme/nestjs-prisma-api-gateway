// import { Input } from "antd";
// import { toast } from "sonner";
import TagSelect from "@/components/TagSelect/TagSelect";
// import { useReactive } from "@/hooks";
// import { TagList } from "@/pages/directorAIAgent/generateScript/components";

export default ({ max = 1, title, data, defaultTags, onChange }: Props) => {
	// const { value, tags, $refs } = useReactive<State>({
	//   value: "",
	//   tags: defaultTags,
	// });
	// const onAdd = () => {
	//   if (!value) {
	//     return toast.error(`请输入${title}`);
	//   }
	//   if (tags.includes(value)) {
	//     return toast.error("不能添加重复标签");
	//   }
	//   $refs.tags.push(value);
	//   $refs.value = "";
	//   data.length < max && onChange(data.concat(value));
	// };
	return (
		<>
			{/* <div className={"text-[14px] text-[#4E5969] mt-[20px] mb-[8px]"}>{title}</div> */}
			{/* <TagList data={tags.map((value) => ({ label: value, value }))} max={max} value={data} onChange={onChange} />
			<Input
				placeholder={`请输入${title}，按回车新增`}
				showCount
				maxLength={20}
				value={value}
				onChange={({ target: { value } }) => {
					$refs.value = value;
				}}
				onPressEnter={onAdd}
				className={"mt-[8px]"}
			/> */}
			<TagSelect title={title} max={max} defaultTags={defaultTags} value={data} onChange={onChange} />
		</>
	);
};

interface Props {
	max: number;
	title: string;
	data: string[];
	defaultTags: { label: string; value: string }[];
	onChange(value: string[]): void;
}
// interface State {
//   value: string;
//   tags: string[];
// }
