// import { parseScriptContent } from "@/utils";

const COLUMN_NAME_MAP: Record<string, string> = {
	分镜: "镜头",
	台词: "脚本内容",
	画面: "画面建议",
};

const COLUMN_NAME_REVERSE_MAP: Record<string, string> = {
	镜头: "分镜",
	脚本内容: "台词",
	画面建议: "画面",
};

interface ScriptColumn {
	title: string;
	dataIndex: string;
}

export interface ScriptTableOpts {
	title: string;
	columns: ScriptColumn[];
	body: Record<string, string>[];
}

export const parseScriptContent = (scriptContent: string): ScriptTableOpts => {
	// --- 新增 1：预处理增强 ---
	// 统一将 "\\t" 字符串转为真实制表符，并将 \r 或 "\\r" "\\n" 换行符统一为 \n，防止正则匹配因 \r 中断
	const sanitized = scriptContent
		.replace(/\\t/g, "\t")
		.replace(/\\r/g, "\n")
		.replace(/\\n/g, "\n")
		.replace(/\r/g, "\n");

	// --- 新增 2：自适应分块逻辑 ---
	// 原来只用 \n\n 分割，现在增加“正向断言”，只要看到“分镜/镜头/标题”开头的行，就认为是一个新块
	// 这样即使 AI 返回的数据没有空行，也能正确切分
	const blocks = sanitized.split(/\n(?=(?:分镜|镜头|标题|\[标题\]))/).filter(Boolean);

	let title = "";
	const body: any[] = [];
	const columns: { title: string; dataIndex: string }[] = [];

	// 预设识别头部 ID 的正则 (如 "分镜1", "分镜 1", "镜头1")
	const headIdRegex = /^(分镜|镜头)\s*(\d+|[a-zA-Z]|\d+-\d+)?/;

	blocks.forEach((block) => {
		const text = block.trim();
		if (!text) return;

		// 处理标题块
		if (text.startsWith("标题") || text.startsWith("[标题]")) {
			title = text.replace(/^(?:\[?标题\]?[:：]?)\s*/, "").trim();
			return;
		}

		const row: Record<string, string> = {};

		// --- 新增 3：头部字段提取优化 ---
		// 不再死板地用 slice(2)，而是用正则匹配“分镜”及其后面的编号
		const headMatch = headIdRegex.exec(text);
		if (headMatch) {
			const rawKey = headMatch[1]; // "分镜" 或 "镜头"
			const idValue = headMatch[2] || ""; // "1" 或 "A" 等
			const mapped = COLUMN_NAME_MAP[rawKey] ?? rawKey;

			if (!columns.find((c) => c.title === mapped)) {
				columns.push({ title: mapped, dataIndex: mapped });
			}
			row[mapped] = idValue;
		}

		// --- 新增 4：全量标签提取逻辑 (关键修复) ---
		// 使用 [\s\S]*? (点号全匹配模式) 穿透台词中的换行符
		// 使用 (?=\[|$) 确保抓取到下一个 [ 标签或块末尾，彻底解决“画面”丢失问题
		const fieldRegex = /\[(?<tag>[^\]]+)\](?<content>[\s\S]*?)(?=\[|$)/g;

		let hasValidField = false;
		for (const match of text.matchAll(fieldRegex)) {
			const { tag, content } = match.groups || {};
			if (tag) {
				const mapped = COLUMN_NAME_MAP[tag] ?? tag;
				if (!columns.find((c) => c.title === mapped)) {
					columns.push({ title: mapped, dataIndex: mapped });
				}
				// trim() 会自动处理掉内容前后的 \t, \n 等干扰字符
				row[mapped] = content.trim();
				hasValidField = true;
			}
		}

		// 只有当这一块包含有效数据时才压入 body
		if (hasValidField || Object.keys(row).length > 0) {
			body.push(row);
		}
	});

	return { title, columns, body };
};
export const toScriptContent = ({ title, columns, body }: ReturnType<typeof parseScriptContent>) => {
	if (!columns?.length && !body?.length && !title) {
		return "";
	}
	const lensColumn = columns?.find(({ dataIndex }) => dataIndex === "镜头") ?? columns?.[0];
	const lines = (body || []).map((row) => {
		const lensKey = lensColumn?.dataIndex || "镜头";
		const lensName = COLUMN_NAME_REVERSE_MAP[lensKey] ?? lensKey;
		const lensValue = row[lensKey] ?? "";
		const parts = [`${lensName}${lensValue}`];
		(columns || []).forEach(({ dataIndex }) => {
			if (dataIndex === lensKey) {
				return;
			}
			let value = row[dataIndex];
			if (value === void 0 || value === "") {
				return;
			}
			// 将实际的换行符转换回字符串形式的 "\n" 或 "\r"？
			// 或者直接保持原样。如果需要保持原样：
			value = String(value).replace(/\n/g, "\\n");
			const rawName = COLUMN_NAME_REVERSE_MAP[dataIndex] ?? dataIndex;
			parts.push(`[${rawName}]${value}`);
		});
		return parts.join("\\t");
	});

	const contentParts = [];
	if (title) contentParts.push(title);
	if (lines.length > 0) contentParts.push(lines.join("\n\n"));

	return contentParts.length > 0 ? `${contentParts.join("\n\n")}\n\n` : "";
};
