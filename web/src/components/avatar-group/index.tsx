// biome-ignore-all lint: 暂时移除整个文件检验
import { Avatar, AvatarFallback } from "@/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/ui/tooltip";
import React from "react";
import type { CSSProperties } from "react";

interface AvatarGroupProps {
	children: React.ReactNode;
	max?: {
		count: number;
		style?: CSSProperties;
	};
	size: number | "large" | "medium" | "small";
}

const getSizeStyles = (size: number | "large" | "medium" | "small"): CSSProperties => {
	if (typeof size === "number") {
		return {
			width: size,
			height: size,
		};
	}

	switch (size) {
		case "small":
			return { width: 24, height: 24 };
		case "medium":
			return { width: 32, height: 32 };
		case "large":
			return { width: 40, height: 40 };
		default:
			return { width: 32, height: 32 };
	}
};

export function AvatarGroup({ children, max, size }: AvatarGroupProps) {
	const avatars = React.Children.toArray(children);
	const total = avatars.length;
	let displayAvatars = avatars;
	let extra = 0;
	let extraAvatars: React.ReactNode[] = [];

	if (max && total > max.count) {
		displayAvatars = avatars.slice(0, max.count - 1);
		extra = total - (max.count - 1);
		extraAvatars = avatars.slice(max.count - 1);
	}

	const sizeStyles = getSizeStyles(size);
	const extraStyles = max?.style ? { ...sizeStyles, ...max.style } : sizeStyles;

	const cloneAvatarWithSize = (child: React.ReactNode) => {
		if (React.isValidElement(child)) {
			const existingStyle = (child.props as any)?.style || {};
			return React.cloneElement(child as React.ReactElement<any>, {
				style: { ...existingStyle, ...sizeStyles },
			});
		}
		return child;
	};

	return (
		<div className="flex -space-x-3">
			{displayAvatars.map((child) => {
				if (React.isValidElement<{ src?: string; alt?: string }>(child)) {
					const key = String(child.key ?? child.props.src ?? child.props.alt ?? child.type);
					return <div key={key}>{cloneAvatarWithSize(child)}</div>;
				}
				return <div key={String(child)}>{cloneAvatarWithSize(child)}</div>;
			})}
			{extra > 0 && (
				<Tooltip>
					<TooltipTrigger asChild>
						<div>
							<Avatar style={extraStyles}>
								<AvatarFallback className="bg-bg-neutral font-semibold">+{extra}</AvatarFallback>
							</Avatar>
						</div>
					</TooltipTrigger>
					<TooltipContent>
						<div className="flex gap-1">
							{extraAvatars.map((child) => {
								if (React.isValidElement<{ src?: string; alt?: string }>(child)) {
									const key = String(child.key ?? child.props.src ?? child.props.alt ?? child.type);
									return <div key={key}>{cloneAvatarWithSize(child)}</div>;
								}
								return <div key={String(child)}>{cloneAvatarWithSize(child)}</div>;
							})}
						</div>
					</TooltipContent>
				</Tooltip>
			)}
		</div>
	);
}
