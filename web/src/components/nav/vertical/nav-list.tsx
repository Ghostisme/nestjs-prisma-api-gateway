import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/ui/collapsible";
import type { NavListProps } from "../types";
import { NavItem } from "./nav-item";

export function NavList({ data, depth = 1, expandedPath, onToggle }: NavListProps) {
	const location = useLocation();
	const activePath = (location.state as { fromMenu?: string } | null)?.fromMenu ?? location.pathname;
	const isActive = activePath.includes(data.path);
	const [open, setOpen] = useState(isActive);
	const hasChild = data.children && data.children.length > 0;

	const isExpanded = depth === 1 ? expandedPath === data.path : open;

	useEffect(() => {
		if (isActive) {
			setOpen(true);
		}
	}, [isActive]);

	// const handleClick = () => {
	// 	if (hasChild && depth === 1 && onToggle) {
	// 		// 手风琴：点击已展开的则关闭，否则切换到当前
	// 		onToggle(expandedPath === data.path ? null : data.path);
	// 	} else if (hasChild) {
	// 		setOpen(!open);
	// 	}
	// };

	if (data.hidden) {
		return null;
	}

	if (depth === 2) {
		// 有子项 → 分组标题 + 三级子项
		if (hasChild) {
			return (
				<div>
					<div className="px-3 pt-3 pb-1 text-xs font-medium text-text-disabled">{data.title}</div>
					{data.children?.map((child) => (
						<NavList key={child.title} data={child} depth={depth + 1} />
					))}
				</div>
			);
		}
		// 没有子项 → 可点击的链接
		return (
			<NavItem
				title={data.title}
				path={data.path}
				icon={data.icon}
				info={data.info}
				caption={data.caption}
				auth={data.auth}
				active={isActive}
				disabled={data.disabled}
				hasChild={false}
				depth={depth}
			/>
		);
	}

	// // depth >= 3: 三级菜单项，纯链接，不折叠
	// if (depth >= 3) {
	//     return (
	//         <NavItem
	//             title={data.title}
	//             path={data.path}
	//             icon={data.icon}
	//             info={data.info}
	//             caption={data.caption}
	//             auth={data.auth}
	//             active={isActive}
	//             disabled={data.disabled}
	//             hasChild={false}
	//             depth={depth}
	//         />
	//     );
	// }

	return (
		<Collapsible
			open={isExpanded}
			onOpenChange={(newOpen) => {
				if (depth === 1 && onToggle) {
					onToggle(newOpen ? data.path : null);
				}
			}}
			data-nav-type="list"
		>
			{/* <CollapsibleTrigger className='w-full'>
                <NavItem
                    // data
                    title={data.title}
                    path={data.path}
                    icon={data.icon}
                    info={data.info}
                    caption={data.caption}
                    auth={data.auth}
                    // state
                    open={open}
                    active={isActive}
                    disabled={data.disabled}
                    // options
                    hasChild={hasChild}
                    depth={depth}
                    // event
                    onClick={handleClick}
                />
            </CollapsibleTrigger> */}
			<CollapsibleTrigger className="w-full">
				<NavItem
					title={data.title}
					path={data.path}
					icon={data.icon}
					info={data.info}
					caption={data.caption}
					auth={data.auth}
					open={isExpanded}
					active={isActive}
					disabled={data.disabled}
					hasChild={hasChild}
					depth={depth}
				/>
			</CollapsibleTrigger>
			{hasChild && (
				<CollapsibleContent>
					<div className="ml-4 mt-1 flex flex-col gap-1">
						{data.children?.map((child) => (
							<NavList key={child.title} data={child} depth={depth + 1} />
						))}
					</div>
				</CollapsibleContent>
				// <CollapsibleContent>
				//     <div className='ml-4 mt-1 flex flex-col gap-1'>
				//         {/* groupLabel 在 children 上方渲染 */}
				//         {data.groupLabel && (
				//             <div className='px-3 pt-2 pb-1 text-md font-medium'>
				//                 {typeof data.groupLabel === 'function' ?
				//                     data.groupLabel()
				//                 :   data.groupLabel}
				//             </div>
				//         )}
				//         {data.children?.map(child => (
				//             <NavList key={child.title} data={child} depth={depth + 1} />
				//         ))}
				//     </div>
				// </CollapsibleContent>
			)}
		</Collapsible>
	);
}
