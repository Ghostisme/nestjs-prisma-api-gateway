import emptyImg from "@/assets/images/empty.png";
/**
 * 根据素材文件访问主路径（request_file_host）与相对路径拼接为完整访问 URL。
 * 用于视频封面、图片等素材资源的访问地址。
 */
export function buildMaterialFileUrl(host: string, path: string | undefined): string {
	if (!path?.trim()) return emptyImg;
	if (/^https?:\/\//i.test(path.trim())) return path.trim();
	const base = host.replace(/\/+$/, "");
	const relative = path.replace(/^\/+/, "").trim();
	if (!relative) return emptyImg;
	return `${base}/${relative}`;
}
