import type { SelectProps } from "antd";

export interface BrandSelectProps extends Omit<SelectProps<number>, "options"> {
	queryEnabled?: boolean;
}
