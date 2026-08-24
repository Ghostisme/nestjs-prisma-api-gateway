import { useQuery } from "@tanstack/react-query";
import { Select } from "antd";
import { type JSX, useMemo } from "react";
import userService, { type TenantAiAgentVO } from "@/api/services/userService";
import type { AgentOptionValue, AgentSelectField, AgentSelectOption, AgentSelectProps } from "./agentSelect.types";

const AVAILABLE_AGENT_QUERY_KEY = ["available-agent-options"] as const;

interface UseAgentSelectOptionsParams {
	queryEnabled?: boolean;
	valueField: AgentSelectField;
	labelField: AgentSelectField;
	prependOptions?: AgentSelectOption[];
}

const isAgentOptionValue = (value: unknown): value is AgentOptionValue =>
	(typeof value === "number" && Number.isFinite(value)) || (typeof value === "string" && value.trim() !== "");

const getAgentOption = (
	agent: TenantAiAgentVO,
	valueField: AgentSelectField,
	labelField: AgentSelectField,
): AgentSelectOption | null => {
	const rawValue = agent[valueField];
	const rawLabel = agent[labelField];

	if (!isAgentOptionValue(rawValue) || !isAgentOptionValue(rawLabel)) {
		return null;
	}

	return {
		label: String(rawLabel),
		value: rawValue,
	};
};

export const useAgentSelectOptions = ({
	queryEnabled = true,
	valueField,
	labelField,
	prependOptions = [],
}: UseAgentSelectOptionsParams) => {
	const { data = [], isPending } = useQuery({
		queryKey: [...AVAILABLE_AGENT_QUERY_KEY, valueField, labelField],
		queryFn: userService.getAvailableAgents,
		enabled: queryEnabled,
	});

	const options = useMemo(
		() => [
			...prependOptions,
			...data
				.map((agent) => getAgentOption(agent, valueField, labelField))
				.filter((option): option is AgentSelectOption => option !== null),
		],
		[data, labelField, prependOptions, valueField],
	);

	return {
		options,
		isLoading: isPending,
	};
};

export function AgentSelect({
	queryEnabled = true,
	placeholder = "Select agent",
	allowClear = true,
	showSearch = true,
	valueField = "agentCode",
	labelField = "agentName",
	prependOptions,
	...props
}: AgentSelectProps): JSX.Element {
	const { options, isLoading } = useAgentSelectOptions({
		queryEnabled,
		valueField,
		labelField,
		prependOptions,
	});

	return (
		<Select
			placeholder={placeholder}
			options={options}
			loading={isLoading}
			optionFilterProp="label"
			allowClear={allowClear}
			showSearch={showSearch}
			{...props}
		/>
	);
}
