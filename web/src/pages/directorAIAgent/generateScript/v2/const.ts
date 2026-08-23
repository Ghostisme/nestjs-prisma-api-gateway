export enum Type {
	RealOralBroadcast = "真人口播",
	TestimonyInterview = "证言采访",
	PlotInterpretation = "剧情演绎",
	ExpertsVisitTheStore = "达人探店",
	LocalLife = "本地生活",
	OriginalPersona = "原创人设",
}
export const tabs = [
	Type.RealOralBroadcast,
	Type.TestimonyInterview,
	Type.PlotInterpretation,
	Type.ExpertsVisitTheStore,
	Type.LocalLife,
	Type.OriginalPersona,
];

export const equityDefaultTags = [
	{ label: "零首付", value: "zero-down-payment" },
	{ label: "低首付", value: "low-down-payment" },
	{ label: "免息", value: "interest-free" },
	{ label: "低息", value: "low-interest" },
	{ label: "低月供", value: "low-monthly-payment" },
	{ label: "低日供", value: "low-daily-payment" },
	{ label: "置换补贴", value: "trade-in-subsidy" },
	{ label: "上市权益", value: "launch-benefits" },
	{ label: "综合权益", value: "comprehensive-benefits" },
	{ label: "现金优惠", value: "cash-discount" },
];
