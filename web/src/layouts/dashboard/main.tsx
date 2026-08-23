import { clone, concat } from "ramda";
import { Suspense } from "react";
import { Navigate, Outlet, ScrollRestoration, useLocation } from "react-router";
import { AuthGuard } from "@/components/auth/auth-guard";
import { LineLoading } from "@/components/loading";
// import { GLOBAL_CONFIG } from "@/global-config";
import Page403 from "@/pages/sys/error/Page403";
import { useSettings } from "@/store/settingStore";
import { useUserPermissions } from "@/store/userStore";
import { cn } from "@/utils";
import { flattenTrees } from "@/utils/tree";
// import { backendNavData } from "./nav/nav-data/nav-data-backend";
import { frontendNavData } from "./nav/nav-data/nav-data-frontend";

// import { tempfrontendNavData } from "./nav/nav-data/nav-data-frontend";

type NavItem = {
	path?: string;
	auth?: string[];
	hidden?: boolean;
	children?: NavItem[];
};

const SUPER_ADMIN_PERMISSION = "*:*:*";
const normalizePath = (path = "") => {
	if (!path) return "/";
	const withLeadingSlash = path.startsWith("/") ? path : `/${path}`;
	if (withLeadingSlash.length > 1 && withLeadingSlash.endsWith("/")) {
		return withLeadingSlash.slice(0, -1);
	}
	return withLeadingSlash;
};
const collectLeafNavItems = (items: NavItem[] = []): NavItem[] =>
	items.flatMap((item) => {
		const children = item.children ?? [];
		if (children.length > 0) return collectLeafNavItems(children);
		return item.hidden ? [] : [item];
	});

/**
 * find auth by path
 * @param path
 * @returns
 */
function findAuthByPath(path: string): string[] {
	const normalizedPath = normalizePath(path);
	const foundItem = allItems.find((item) => normalizePath(item.path) === normalizedPath);
	return foundItem?.auth || [];
}

// const navData = GLOBAL_CONFIG.routerMode === "frontend" ? clone(tempfrontendNavData) : backendNavData;
const navData = clone(frontendNavData);
const allItems = navData.reduce((acc: any[], group) => {
	const flattenedItems = flattenTrees(group.items);
	return concat(acc, flattenedItems);
}, []);

const allLeafItems = navData.reduce(
	(acc: NavItem[], group) => concat(acc, collectLeafNavItems(group.items as NavItem[])),
	[] as NavItem[],
);
function PermissionFallback() {
	const { pathname } = useLocation();
	const permissions = useUserPermissions();

	const isSuperAdmin = permissions.some((p) => p.code === SUPER_ADMIN_PERMISSION);
	if (isSuperAdmin) {
		// 超级管理员拥有所有权限，不需要 fallback
		return null; // 或者正常渲染内容
	}

	const permissionCodes = new Set(permissions.map((permission) => permission.code));
	const currentPath = normalizePath(pathname);

	const redirectPath = allLeafItems
		.filter((item) => item.path)
		.map((item) => ({
			path: normalizePath(item.path),
			auth: item.auth || [],
		}))
		.find((item) => {
			if (item.path === currentPath) return false;
			return item.auth.length === 0 || item.auth.some((code) => permissionCodes.has(code));
		})?.path;
	if (redirectPath) {
		return <Navigate to={redirectPath} replace />;
	}
	return <Page403 />;
}

const Main = () => {
	const { themeStretch } = useSettings();

	const { pathname } = useLocation();
	const currentNavAuth = findAuthByPath(pathname);

	return (
		<AuthGuard checkAny={currentNavAuth} fallback={<PermissionFallback />}>
			<main
				data-slot="slash-layout-main"
				className={cn(
					"flex-auto w-full flex flex-col",
					"transition-[max-width] duration-300 ease-in-out",
					"px-4 sm:px-6 py-4 sm:py-6 md:px-8 mx-auto",
					{
						"max-w-full": themeStretch,
						// "xl:max-w-screen-xl": !themeStretch,
					},
				)}
				style={{
					willChange: "max-width",
				}}
			>
				<Suspense fallback={<LineLoading />}>
					<Outlet />
					<ScrollRestoration />
				</Suspense>
			</main>
		</AuthGuard>
	);
};

export default Main;
