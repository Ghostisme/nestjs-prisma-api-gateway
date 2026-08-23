import { rgbAlpha } from "@/utils/theme";
import { ThemeColorPresets } from "#/enum";

export const presetsColors = {
	[ThemeColorPresets.Default]: {
		lighter: "#E8F3FF",
		light: "#94BFFF",
		default: "#165DFF",
		dark: "#0E42D2",
		darker: "#052684",
	},
	[ThemeColorPresets.Cyan]: {
		lighter: "#CCF4FE",
		light: "#68CDF9",
		default: "#078DEE",
		dark: "#0351AB",
		darker: "#012972",
	},
	[ThemeColorPresets.Purple]: {
		lighter: "#EFD5FF",
		light: "#B37FEB",
		default: "#722ED1",
		dark: "#531DAB",
		darker: "#391085",
	},
	[ThemeColorPresets.Blue]: {
		lighter: "#D1E9FC",
		light: "#76B0F1",
		default: "#2065D1",
		dark: "#103996",
		darker: "#061B64",
	},
	[ThemeColorPresets.Orange]: {
		lighter: "#FEF4D4",
		light: "#FED680",
		default: "#FDA92D",
		dark: "#B66816",
		darker: "#793908",
	},
	[ThemeColorPresets.Red]: {
		lighter: "#FFE3D5",
		light: "#FF9882",
		default: "#FF3030",
		dark: "#B71D33",
		darker: "#7A0916",
	},
	[ThemeColorPresets.Pink]: {
		lighter: "#FFE3F2",
		light: "#FF97D5",
		default: "#FF3094",
		dark: "#B71D67",
		darker: "#7A0C3F",
	},
};

/**
 * We recommend picking colors with these values for [Eva Color Design](https://colors.eva.design/):
 *  + lighter : 100
 *  + light : 300
 *  + main : 500
 *  + dark : 700
 *  + darker : 900
 */
export const paletteColors = {
	primary: presetsColors[ThemeColorPresets.Default],
	success: {
		lighter: "#E6F8EA",
		light: "#85E0A3",
		default: "#00B42A",
		dark: "#008C20",
		darker: "#005914",
	},
	warning: {
		lighter: "#FFF7E6",
		light: "#FFC480",
		default: "#FF7D00",
		dark: "#D96000",
		darker: "#8C3600",
	},
	error: {
		lighter: "#FFECE8",
		light: "#FFB4AD",
		default: "#F53F3F",
		dark: "#CC2929",
		darker: "#850F0F",
	},
	info: {
		lighter: "#E8F3FF",
		light: "#94BFFF",
		default: "#165DFF",
		dark: "#0E42D2",
		darker: "#052684",
	},
	gray: {
		"100": "#F7F8FA",
		"200": "#F5F5F5",
		"300": "#EFEFEF",
		"400": "#E5E5E5",
		"500": "#86909C",
		"600": "#4E5969",
		"700": "#333333",
		"800": "#1D2129",
		"900": "#000000",
	},
};

export const commonColors = {
	white: "#FFFFFF",
	black: "#09090B",
};

export const actionColors = {
	hover: rgbAlpha(paletteColors.gray[500], 0.1),
	selected: rgbAlpha(paletteColors.gray[500], 0.1),
	focus: rgbAlpha(paletteColors.gray[500], 0.12),
	disabled: rgbAlpha(paletteColors.gray[500], 0.48),
	active: rgbAlpha(paletteColors.gray[500], 1),
};

export const lightColorTokens = {
	palette: paletteColors,
	common: commonColors,
	action: actionColors,
	text: {
		primary: paletteColors.gray[800],
		secondary: paletteColors.gray[600],
		disabled: paletteColors.gray[500],
	},
	background: {
		default: paletteColors.gray[100],
		paper: commonColors.white,
		neutral: paletteColors.gray[200],
	},
};

export const darkColorTokens = {
	palette: paletteColors,
	common: commonColors,
	action: actionColors,
	text: {
		primary: commonColors.white,
		secondary: paletteColors.gray[500],
		disabled: paletteColors.gray[600],
	},
	background: {
		default: commonColors.black,
		paper: commonColors.black,
		neutral: "#27272A",
	},
};
