import type { JSX, ReactNode } from "react";

interface ChartCardProps {
	title: string;
	children: ReactNode;
	className?: string;
}

export const ChartCard = ({ title, children, className = "" }: ChartCardProps): JSX.Element => {
	return (
		<div className={`rounded-xl bg-[var(--card)] p-5 shadow-sm border border-[var(--border)] ${className}`}>
			<h3 className="text-base font-semibold text-[var(--foreground)] mb-4">{title}</h3>
			{children}
		</div>
	);
};
