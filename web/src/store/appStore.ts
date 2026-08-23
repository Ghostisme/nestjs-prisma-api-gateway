import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { SettingInfo } from "@/api/config";

type AppStore = {
	/** 设置信息（getSettingInfo 接口返回值，含 request_file_host 等） */
	settingInfo: SettingInfo | null;
	actions: {
		setSettingInfo: (info: SettingInfo | null) => void;
	};
};

const useAppStore = create<AppStore>()(
	persist(
		(set) => ({
			settingInfo: null,
			actions: {
				setSettingInfo: (settingInfo) => set({ settingInfo }),
			},
		}),
		{
			name: "appStore",
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({ settingInfo: state.settingInfo }),
		},
	),
);

export const useSettingInfo = () => useAppStore((state) => state.settingInfo);
export const useAppActions = () => useAppStore((state) => state.actions);
export const useRequestFileHost = () => useAppStore((state) => state.settingInfo?.requestFileHost ?? "");
export const useOccupySize = () => useAppStore((state) => state.settingInfo?.occupySize ?? "");
export const setGlobalSettingInfo = (settingInfo: SettingInfo | null) =>
	useAppStore.getState().actions.setSettingInfo(settingInfo);
