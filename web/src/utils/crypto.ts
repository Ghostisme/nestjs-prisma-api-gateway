import * as CryptoJS from "crypto-js";

// 配置
const key = "thanks.platform."; // 16字节密钥
const iv = "thanks.platform."; // 16字节IV（与密钥相同）

// 加密函数
export function encryptPassword(password: string) {
	// 补全到16字节（NoPadding要求）
	const paddedPassword = padTo16Bytes(password);

	// AES-CFB加密
	const encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(paddedPassword), CryptoJS.enc.Utf8.parse(key), {
		iv: CryptoJS.enc.Utf8.parse(iv),
		mode: CryptoJS.mode.CFB,
		padding: CryptoJS.pad.NoPadding,
	});

	// 转换为Hex字符串
	return encrypted.ciphertext.toString(CryptoJS.enc.Hex);
}

// 补全到16字节
function padTo16Bytes(str: string) {
	const bytes = new TextEncoder().encode(str);
	const result = new Uint8Array(16);
	result.set(bytes.slice(0, 16));
	return new TextDecoder().decode(result);
}
