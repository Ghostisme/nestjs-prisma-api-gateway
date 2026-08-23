import { Select } from "antd";
import type { TagSelectProps } from "./TagSelect.types";

const TagSelect: React.FC<TagSelectProps> = ({
	title,
	max,
	defaultTags,
	value,
	onChange,
	placeholder,
	maxLength = 20,
}) => {
	return (
		<>
			<div className="text-[14px] text-[#4E5969] mt-[20px] mb-[8px]">{title}</div>
			<Select
				mode="tags"
				maxCount={max}
				style={{ width: "100%" }}
				value={value}
				onChange={onChange}
				maxLength={maxLength}
				// options={defaultTags}
				options={defaultTags}
				placeholder={placeholder}
				showSearch={{ optionFilterProp: "label" }}
			/>
		</>
	);
};

export default TagSelect;
