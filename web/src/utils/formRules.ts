import type { RuleObject } from "antd/es/form";

// type WhitespaceRuleOptions = {
//   message?: string;
//   /** 是否在校验前自动 trim（配合 Form.Item 的 normalize 使用） */
//   required?: boolean;
// };

/**
 * 创建禁止纯空格的必填校验规则
 * @example
 * <Form.Item rules={[requiredWithTrim("请输入品牌名称")]}>
 */
export const requiredWithTrim = (message = "该字段为必填项"): RuleObject => ({
	required: true,
	validator: (_, value) => {
		if (typeof value === "string" && !value.trim()) {
			return Promise.reject(new Error(message));
		}
		if (value === undefined || value === null || value === "") {
			return Promise.reject(new Error(message));
		}
		return Promise.resolve();
	},
});

/**
 * 禁止纯空格的校验规则（非必填场景，有值时校验）
 * @example
 * <Form.Item rules={[noWhitespaceOnly("不能为纯空格")]}>
 */
export const noWhitespaceOnly = (message = "输入内容不能为纯空格"): RuleObject => ({
	validator: (_, value) => {
		if (typeof value === "string" && value.length > 0 && !value.trim()) {
			return Promise.reject(new Error(message));
		}
		return Promise.resolve();
	},
});

/**
 * 用于 Form.Item 的 normalize 属性，自动 trim 首尾空格
 * @example
 * <Form.Item normalize={trimNormalize}>
 */
export const trimNormalize = (value: unknown): unknown => {
	if (typeof value === "string") return value.trim();
	return value;
};
