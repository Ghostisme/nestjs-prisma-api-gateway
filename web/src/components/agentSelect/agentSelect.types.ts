import type { SelectProps } from "antd";
import type { TenantAiAgentVO } from "@/api/services/userService";

export type AgentOptionValue = string | number;
export type AgentSelectField = keyof TenantAiAgentVO;
export type AgentSelectOption = NonNullable<SelectProps<AgentOptionValue>["options"]>[number];

export interface AgentSelectProps extends Omit<SelectProps<AgentOptionValue>, "options"> {
	queryEnabled?: boolean;
	valueField?: AgentSelectField;
	labelField?: AgentSelectField;
	prependOptions?: AgentSelectOption[];
}
