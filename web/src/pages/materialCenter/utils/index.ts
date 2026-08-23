export const materialCenterSearchResponsive = {
	xs: {
		columns: 1,
		layout: "vertical",
		gap: 12,
		actionsPlacement: "bottom",
		actionsDirection: "horizontal",
	},
	md: {
		columns: 1,
		layout: "horizontal",
		actionsPlacement: "right",
		actionsDirection: "vertical",
	},
	lg: {
		columns: 2,
	},
	xl: {
		columns: 3,
	},
	xxl: {
		columns: 3,
	},
	xxxl: {
		columns: 4,
	},
} as const;
