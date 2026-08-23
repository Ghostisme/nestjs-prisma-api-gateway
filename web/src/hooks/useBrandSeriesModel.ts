export default (name: string = "brandCombination", props?: Record<string, any>) => {
	const normalizeParams = (params: Record<string, any>) => {
		const value = params[name];
		if (Array.isArray(value)) {
			params[name] = value.join(",");
		}
		return params;
	};
	const getBrandSeriesContent = ({ subBrandName, seriesName, modelName }: Record<string, any>) =>
		[subBrandName, seriesName, modelName].filter(Boolean).join("/");
	return {
		brandSeriesModelOpts: { name, label: "品牌/车系", type: "brandTreeSelect" as const, props },
		normalizeParams,
		getBrandSeriesContent,
	};
};
