export interface TagSelectProps {
	title: string;
	max: number;
	defaultTags: { label: string; value: string }[];
	value: string[];
	onChange: (value: string[]) => void;
	placeholder?: string;
	maxLength?: number;
}
