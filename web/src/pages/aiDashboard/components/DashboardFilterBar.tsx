import { DatePicker, Select } from "antd";
import { type JSX, type ReactNode, useCallback, useMemo, useState } from "react";
import type { DashboardFilter, TimeFilterType } from "../types";

const { RangePicker } = DatePicker;

interface DashboardFilterBarProps {
	onFilterChange: (filter: DashboardFilter) => void;
	modelOptions?: { label: string; value: string }[];
	agentOptions?: { label: string; value: string }[];
	renderAgentSelect?: (props: {
		value: DashboardFilter["agent"];
		onChange: (value: DashboardFilter["agent"]) => void;
	}) => ReactNode;
}

const TIME_FILTER_OPTIONS: { label: string; value: TimeFilterType }[] = [
	{ label: "All", value: "all" },
	{ label: "Yesterday", value: "yesterday" },
	{ label: "7 Days", value: "last7days" },
	{ label: "30 Days", value: "last30days" },
];

const DEFAULT_MODEL_OPTIONS = [{ label: "All Models", value: "all" }];
const DEFAULT_AGENT_OPTIONS = [{ label: "All Agents", value: "all" }];

export const DashboardFilterBar = ({
	onFilterChange,
	modelOptions = DEFAULT_MODEL_OPTIONS,
	agentOptions = DEFAULT_AGENT_OPTIONS,
	renderAgentSelect,
}: DashboardFilterBarProps): JSX.Element => {
	const [filter, setFilter] = useState<DashboardFilter>({
		model: "all",
		agent: "all",
		timeRange: "all",
	});

	const handleChange = useCallback(
		(partial: Partial<DashboardFilter>) => {
			const newFilter = { ...filter, ...partial };
			setFilter(newFilter);
			onFilterChange(newFilter);
		},
		[filter, onFilterChange],
	);

	const activeTimeFilter = filter.timeRange;
	const handleAgentChange = useCallback(
		(value: DashboardFilter["agent"]) => {
			handleChange({ agent: value });
		},
		[handleChange],
	);

	const timeButtons = useMemo(
		() =>
			TIME_FILTER_OPTIONS.map((opt) => (
				<button
					key={opt.value}
					type="button"
					onClick={() => handleChange({ timeRange: opt.value })}
					className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
						activeTimeFilter === opt.value
							? "bg-[var(--primary)] text-white shadow-sm"
							: "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
					}`}
				>
					{opt.label}
				</button>
			)),
		[activeTimeFilter, handleChange],
	);

	return (
		<div className="flex flex-wrap items-center gap-4 mb-6 rounded-xl bg-[var(--card)] px-5 py-4 shadow-sm border border-[var(--border)]">
			<div className="flex items-center gap-2">
				<span className="text-sm font-medium text-[var(--foreground)]">Model:</span>
				<Select
					value={filter.model}
					onChange={(val) => handleChange({ model: val })}
					options={modelOptions}
					className="w-36"
					size="middle"
				/>
			</div>

			<div className="flex items-center gap-2">
				<span className="text-sm font-medium text-[var(--foreground)]">Agent:</span>
				{renderAgentSelect ? (
					renderAgentSelect({
						value: filter.agent,
						onChange: handleAgentChange,
					})
				) : (
					<Select
						value={filter.agent}
						onChange={(val) => handleAgentChange(val)}
						options={agentOptions}
						className="w-36"
						size="middle"
					/>
				)}
			</div>

			<div className="flex items-center gap-2">
				<span className="text-sm font-medium text-[var(--foreground)]">Time Range:</span>
				<div className="flex items-center gap-1 rounded-lg bg-[var(--accent)] p-1">{timeButtons}</div>
			</div>

			<RangePicker
				placeholder={["Start & end date", ""]}
				className="ml-auto"
				onChange={(_dates, dateStrings) => {
					if (dateStrings[0] && dateStrings[1]) {
						handleChange({
							timeRange: "custom",
							customRange: [dateStrings[0] as string, dateStrings[1] as string],
						});
					}
				}}
			/>
		</div>
	);
};
