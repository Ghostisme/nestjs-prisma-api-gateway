import { useState } from "react";
import { useLocation } from "react-router";
import { cn } from "@/utils";
import type { NavProps } from "../types";
import { NavGroup } from "./nav-group";

export function NavVertical({ data, className, ...props }: NavProps) {
	const location = useLocation();
	const activePath = (location.state as { fromMenu?: string } | null)?.fromMenu ?? location.pathname;

	const [expandedPath, setExpandedPath] = useState<string | null>(() => {
		for (const group of data) {
			const match = group.items.find((item) => activePath.includes(item.path));
			if (match) return match.path;
		}
		return null;
	});
	return (
		<nav className={cn("flex w-full flex-col gap-1", className)} {...props}>
			{data.map((group, index) => (
				<NavGroup
					key={group.name || index}
					name={group.name}
					items={group.items}
					expandedPath={expandedPath}
					onToggle={setExpandedPath}
				/>
			))}
		</nav>
		// <nav className={cn('flex w-full flex-col gap-1', className)} {...props}>
		//     {data.map((group, index) => (
		//         <NavGroup key={group.name || index} name={group.name} items={group.items} />
		//     ))}
		// </nav>
	);
}
