import { useMemo } from "react";
import type { NavItemDataProps } from "@/components/nav/types";
// import { GLOBAL_CONFIG } from "@/global-config";
import { useUserPermissions } from "@/store/userStore";
import { checkAny } from "@/utils";
// import { backendNavData } from "./nav-data-backend";
import { frontendNavData } from "./nav-data-frontend";

// import { tempfrontendNavData } from "./nav-data-frontend";

// const navData = GLOBAL_CONFIG.routerMode === "backend" ? backendNavData : frontendNavData;
const navData = frontendNavData;
// const navData = tempfrontendNavData;

/** 深拷贝导航项（避免 filterItems 污染全局 navData，切换账号后权限能正确刷新） */
const cloneNavItems = (items: NavItemDataProps[]): NavItemDataProps[] =>
	items.map((item) => ({
		...item,
		children: item.children?.length ? cloneNavItems(item.children) : undefined,
	}));

/**
 * 递归处理导航数据，过滤掉没有权限的项目（在拷贝上操作，不修改原始 navData）
 * @param items 导航项目数组
 * @param permissions 权限列表
 * @returns 过滤后的导航项目数组
 */
const filterItems = (items: NavItemDataProps[], permissions: string[]): NavItemDataProps[] => {
	return items.filter((item) => {
		// 检查当前项目是否有权限
		const hasPermission = item.auth ? checkAny(item.auth, permissions) : true;

		// 如果有子项目，递归处理
		if (item.children?.length) {
			const filteredChildren = filterItems(item.children, permissions);
			// 如果子项目都被过滤掉了，则过滤掉当前项目
			if (filteredChildren.length === 0) {
				return false;
			}
			// 更新子项目
			item.children = filteredChildren;
		}

		return hasPermission;
	});
};

/**
 *
 * 根据权限过滤导航数据（每次基于原始 navData 的拷贝过滤，切换账号后菜单正确更新）
 * @param permissions 权限列表
 * @returns 过滤后的导航数据
 */
const filterNavData = (permissions: string[]) => {
	const clonedData = navData.map((group) => ({
		...group,
		items: cloneNavItems(group.items),
	}));
	return clonedData
		.map((group) => {
			// 过滤组内的项目
			const filteredItems = filterItems(group.items, permissions);

			// 如果组内没有项目了，返回 null
			if (filteredItems.length === 0) {
				return null;
			}

			// 返回过滤后的组
			return {
				...group,
				items: filteredItems,
			};
		})
		.filter((group): group is NonNullable<typeof group> => group !== null);
};

/**
 * Hook to get filtered navigation data based on user permissions
 * @returns Filtered navigation data
 */
export const useFilteredNavData = () => {
	const permissions = useUserPermissions();
	const permissionCodes = useMemo(() => permissions.map((p) => p.code), [permissions]);
	const filteredNavData = useMemo(() => filterNavData(permissionCodes), [permissionCodes]);
	return filteredNavData;
};
