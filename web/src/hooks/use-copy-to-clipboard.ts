import { useState } from "react";
import { toast } from "sonner";

type CopiedValue = string | null;
type CopyFn = (text: string, tip?: string) => Promise<boolean>;
type ReturnType = {
	copyFn: CopyFn;
	copiedText: CopiedValue;
};

const fallbackCopy = (text: string): boolean => {
	const textarea = document.createElement("textarea");
	textarea.value = text;
	textarea.style.position = "fixed";
	textarea.style.left = "-9999px";
	textarea.style.top = "-9999px";
	document.body.appendChild(textarea);
	textarea.focus();
	textarea.select();
	try {
		return document.execCommand("copy");
	} finally {
		document.body.removeChild(textarea);
	}
};
export const useCopyToClipboard = (): ReturnType => {
	const [copiedText, setCopiedText] = useState<CopiedValue>(null);

	const copyFn: CopyFn = async (text, tip = "复制成功") => {
		try {
			if (navigator?.clipboard) {
				await navigator.clipboard.writeText(text);
			} else {
				if (!fallbackCopy(text)) {
					throw new Error("execCommand copy failed");
				}
			}
			setCopiedText(text);
			toast.success(tip);
			return true;
		} catch (error) {
			console.warn("复制失败", error);
			toast.error("复制失败");
			setCopiedText(null);
			return false;
		}
	};

	return { copiedText, copyFn };
};
