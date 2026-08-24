import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Permission, UserInfo, UserInfoFromApi, UserToken } from "#/entity";
import { StorageEnum } from "#/enum";
import userService, { type SignInReq } from "@/api/services/userService";

/** 将接口返回的 permissions（可能为 code 字符串数组）规范为 { code }[]，供菜单/按钮权限匹配使用 */
const normalizePermissions = (permissions: Permission[] | string[] | undefined): Permission[] => {
	if (!permissions?.length) return [];
	const first = permissions[0];
	if (typeof first === "string") {
		return (permissions as string[]).map((code) => ({ id: code, code, name: code }));
	}
	return permissions as Permission[];
};

/** 登录接口返回字符串权限码时，先在入库前做一次去重，避免 localStorage 中出现重复权限 */
const dedupePermissionCodes = (permissions: string[] | undefined): string[] => {
	if (!permissions?.length) return [];
	return [...new Set(permissions)];
};

const DEMO_NICKNAMES: Record<string, string> = {
	开发管理员: "Dev Admin",
};

const localizeDemoUserInfo = <T extends Partial<UserInfo>>(userInfo: T): T => {
	const nickname = userInfo.nickname;
	if (!nickname || !DEMO_NICKNAMES[nickname]) return userInfo;
	return { ...userInfo, nickname: DEMO_NICKNAMES[nickname] };
};

type UserStore = {
	userInfo: Partial<UserInfo>;
	userToken: UserToken;
	tenantId?: number;

	actions: {
		setUserInfo: (userInfo: UserInfo | UserInfoFromApi) => void;
		setUserToken: (token: UserToken) => void;
		setTenantId: (tenantId?: number) => void;
		clearUserInfoAndToken: () => void;
	};
};

const useUserStore = create<UserStore>()(
	persist(
		(set) => ({
			userInfo: {},
			userToken: {},
			tenantId: undefined,
			actions: {
				setUserInfo: (userInfo) => {
					const permissions = normalizePermissions(userInfo.permissions);
					set({ userInfo: localizeDemoUserInfo({ ...userInfo, permissions }) });
				},
				setUserToken: (userToken) => {
					set({ userToken });
				},
				setTenantId: (tenantId) => {
					set({ tenantId });
				},
				clearUserInfoAndToken() {
					set({ userInfo: {}, userToken: {}, tenantId: undefined });
				},
			},
		}),
		{
			name: "userStore",
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({
				[StorageEnum.UserInfo]: state.userInfo,
				[StorageEnum.UserToken]: state.userToken,
				[StorageEnum.TenantId]: state.tenantId,
			}),
			onRehydrateStorage: () => (state) => {
				if (!state?.userInfo) return;
				const localized = localizeDemoUserInfo(state.userInfo);
				if (localized !== state.userInfo) {
					state.userInfo = localized;
				}
			},
		},
	),
);

export const useUserInfo = () => useUserStore((state) => localizeDemoUserInfo(state.userInfo));
export const useUserToken = () => useUserStore((state) => state.userToken);
export const useTenantId = () => useUserStore((state) => state.tenantId);
export const useUserPermissions = () => useUserStore((state) => state.userInfo.permissions || []);
export const useUserRoles = () => useUserStore((state) => state.userInfo.roles || []);
export const useUserActions = () => useUserStore((state) => state.actions);

export const useSignIn = () => {
	const { setTenantId, setUserToken, setUserInfo } = useUserActions();

	const signInMutation = useMutation({
		mutationFn: userService.signin,
	});

	const signIn = async (data: SignInReq) => {
		try {
			const res = await signInMutation.mutateAsync(data);
			const { access_token, refresh_token, user_info } = res;

			setUserToken({
				accessToken: access_token,
				refreshToken: refresh_token,
			});
			setTenantId(data.tenantId);

			// BFF 权限接口 /api/lumax/v1/user/permissions 当前已停用。
			// 这里先保留原调用逻辑的注释，后续如果需要恢复双端权限合并，可以直接参考这段代码。
			// let bffPermissions: string[] = [];
			// try {
			// 	const bffRes = await bffClient.get<{ permissions: string[] }>("/lumax/v1/user/permissions");
			// 	bffPermissions = bffRes?.permissions ?? [];
			// } catch {
			// 	// BFF 不可用时降级，仅使用 Java 返回的权限
			// }

			// 当前仅使用 Java 登录接口返回的 user_info.permissions，并在写入 userStore 前去重。
			const javaPermissions: string[] = Array.isArray(user_info.permissions) ? (user_info.permissions as string[]) : [];
			const mergedPermissions = dedupePermissionCodes(javaPermissions);

			setUserInfo({ ...user_info, permissions: mergedPermissions });
		} catch (err) {
			toast.error(err.message, {
				position: "top-center",
			});
			throw err;
		}
	};

	return signIn;
};

export default useUserStore;
