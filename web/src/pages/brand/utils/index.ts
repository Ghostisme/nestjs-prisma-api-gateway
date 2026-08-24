import { message } from "antd";
import { uploadService } from "@/api/upload";

export const exportDownload = async (api: string, search: string) => {
	const raw = sessionStorage.getItem(search);
	let cachedValues: Record<string, unknown> = {};
	if (raw) {
		try {
			cachedValues = JSON.parse(raw) as Record<string, unknown>;
		} catch {
			cachedValues = {};
		}
	}
	const { data, filename } = await uploadService.download(api, {
		...cachedValues,
	});

	const blobUrl = window.URL.createObjectURL(data);

	const link = document.createElement("a");
	link.href = blobUrl;
	link.download = filename || "default.xlsx"; // 优先使用后端返回的文件名
	document.body.appendChild(link);
	link.click();

	document.body.removeChild(link);
	window.URL.revokeObjectURL(blobUrl);
	message.success("Exported");
};

export const tableCfg = {
	search: {
		layout: "horizontal" as const,
		showAdvanced: false,
		isButtonHorizontal: true,
		colSpan: 6,
		gap: 12,
		grid: {
			// 默认（最小屏幕）为 1 列
			columns: 1,
			// 中等屏幕（md）分配 2 列
			md: 2,
			// 大屏幕（lg 及以上）分配 3 列
			lg: 3,
			// 如果 xl 也要保持大布局，通常设为 3（或者根据你之前代码的特殊需求设为 1）
			xl: 3,
			gap: 12,
		},
	},
	scroll: { x: "max-content" },
	toolbar: {
		align: "left" as const,
	},
};
