interface ScriptColumn {
	title: string;
	dataIndex: string;
}

export interface ScriptTableOpts {
	title: string;
	columns: ScriptColumn[];
	body: Record<string, string>[];
}

const COLUMN_NAME_MAP: Record<string, string> = {
	分镜: "镜头",
	台词: "脚本内容",
	画面: "画面建议",
};

export const parseScriptContent = (scriptContent: string): ScriptTableOpts => {
	const [it, ...arr] = scriptContent.split("\n\n").filter(Boolean);
	const title = it?.replaceAll("\\t", " ")?.replaceAll("\t", " ").trim();
	const opts = arr.reduce(
		(opts, it) => {
			const { columns } = opts;
			const normalized = it?.replaceAll("\\t", "\t").trim();
			const [a, ...b] = normalized
				.split(/(?=\[[^\]]+\])/)
				.map((value) => value.trim())
				.filter(Boolean);
			if (!a) {
				return opts;
			}
			const lensMatch = /^(?<title>分镜)\s*(?<content>[\s\S]*)$/.exec(a);
			const rawTitle = lensMatch?.groups?.title || a.slice(0, 2);
			const mappedTitle = COLUMN_NAME_MAP[rawTitle] ?? rawTitle;
			if (!columns.find((it) => it.title === mappedTitle)) {
				columns.push({ title: mappedTitle, dataIndex: mappedTitle });
			}
			const obj: Record<string, string> = {
				[mappedTitle]: (lensMatch?.groups?.content || a.slice(2)).trim(),
			};
			b.forEach((it) => {
				const result = /^\[(?<title>.+?)\]\s*(?<content>[\s\S]*)$/.exec(it.trim());
				if (!result?.groups) return;
				const { title, content } = result.groups;
				const mapped = COLUMN_NAME_MAP[title] ?? title;
				if (!columns.find((it) => it.title === mapped)) {
					columns.push({ title: mapped, dataIndex: mapped });
				}
				obj[mapped] = content.trim();
			});
			opts.body.push(obj);
			return opts;
		},
		{ columns: [], body: [] } as Omit<ScriptTableOpts, "title">,
	);
	return { title, ...opts };
};
