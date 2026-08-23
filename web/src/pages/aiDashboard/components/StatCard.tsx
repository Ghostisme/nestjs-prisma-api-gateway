import { Icon } from "@/components/icon";
import type { StatCardData } from "../types";
import type { JSX } from "react";

interface StatCardProps {
	data: StatCardData;
}

export const StatCard = ({ data }: StatCardProps): JSX.Element => {
	const { title, value, dayOverDay, prefix, suffix } = data;
	const isPositive = (dayOverDay ?? 0) >= 0;

	return (
		<div className="rounded-xl bg-[var(--card)] p-5 shadow-sm border border-[var(--border)] transition-all hover:shadow-md">
			<div className="text-sm text-[var(--muted-foreground)] mb-2">{title}</div>
			<div className="text-2xl font-bold text-[var(--foreground)]">
				{prefix}
				{value}
				{suffix}
			</div>
			{dayOverDay !== undefined && (
				<div className="flex items-center gap-1 mt-2 text-xs">
					<span className="text-[var(--muted-foreground)]">vs prev.</span>
					<Icon
						icon={isPositive ? "lucide:trending-up" : "lucide:trending-down"}
						size={14}
						color={isPositive ? "var(--colors-palette-success-default)" : "var(--colors-palette-error-default)"}
					/>
					<span
						style={{
							color: isPositive ? "var(--colors-palette-success-default)" : "var(--colors-palette-error-default)",
						}}
					>
						{Math.abs(dayOverDay)}%
					</span>
				</div>
			)}
		</div>
	);
};
