import doubao from "@/assets/images/directorAIAgent/doubao.png";
import policy_detonation from "@/assets/images/directorAIAgent/policy_detonation.png";
import product_seeding from "@/assets/images/directorAIAgent/product_seeding.png";

export enum ModelType {
	/**
	 * 豆包模型
	 */
	DOUBAO = "Doubao",
	/**
	 * DeepSeek模型
	 */
	DEEPSEEK = "DeepSeek",
}
export enum ScriptType {
	/**
	 * 政策引爆脚本
	 */
	POLICY_DETONATION = "policy_detonation",
	/**
	 * 口碑见证脚本
	 */
	WORD_OF_MOUTH = "word_of_mouth",
	/**
	 * 产品种草脚本
	 */
	PRODUCT_SEEDING = "product_seeding",
}
export enum PresentationForm {
	/**
	 * 真人口播
	 */
	REAL_PERSON = "real_person",
	/**
	 * 证言采访
	 */
	TESTIMONIAL = "testimonial",
	/**
	 * 剧情演绎
	 */
	DRAMA = "drama",
}

export const PRESENTATION_FORM_OPTIONS = [
	{ label: "真人口播", value: "真人口播" },
	{ label: "证言采访", value: "证言采访" },
	{ label: "剧情演绎", value: "剧情演绎" },
	{ label: "达人探店", value: "达人探店" },
	{ label: "本地生活", value: "本地生活" },
	{ label: "原创人设", value: "原创人设" },
];
export const MODEL_TYPE_ICON_MAP = {
	[ModelType.DOUBAO]: doubao,
	[ModelType.DEEPSEEK]: "ri:deepseek-fill",
};
export const SCRIPT_TYPE_ICON_MAP: Record<ScriptType, string> = {
	[ScriptType.POLICY_DETONATION]: policy_detonation,
	[ScriptType.WORD_OF_MOUTH]: "",
	[ScriptType.PRODUCT_SEEDING]: product_seeding,
};
export const PRESENTATION_FORM_MAP: Record<string, { icon: string; name: string; className: string }> = {
	[PresentationForm.REAL_PERSON]: {
		icon: "mdi:account-voice",
		name: "真人口播",
		className: "text-[#00B42A] bg-[#E6FFEC]",
	},
	[PresentationForm.TESTIMONIAL]: {
		icon: "mdi:microphone",
		name: "证言采访",
		className: "text-[#FF7D00] bg-[#FBE7D3]",
	},
	[PresentationForm.DRAMA]: { icon: "mdi:movie-open", name: "剧情演绎", className: "text-[#165DFF] bg-[#DBE6FF]" },
	达人探店: { icon: "mdi:store-search", name: "达人探店", className: "text-[#EC4899] bg-[#FCE7F3]" },
	本地生活: { icon: "mdi:map-marker-radius", name: "本地生活", className: "text-[#CA8A04] bg-[#FEF9C3]" },
	原创人设: { icon: "mdi:store-search", name: "原创人设", className: "text-[#8B5CF6] bg-[#EDE9FE]" },
};
