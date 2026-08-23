import { getSettingInfo } from "@/api/config";
import { setGlobalSettingInfo } from "@/store/appStore";

export async function initSettingInfo(): Promise<void> {
	try {
		const settingInfo = await getSettingInfo();
		setGlobalSettingInfo(settingInfo);
	} catch {
		// 网络异常时保留本地持久化数据
	}
}
