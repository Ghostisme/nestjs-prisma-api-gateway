import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import SparkMD5 from "spark-md5";
import { axiosInstance } from "./apiClient";
import { getSmartContentType } from "./uploadContentType";

// --- 类型定义 ---

export interface ApiResponse<T = any> {
	code: number;
	data: T;
	msg: string;
	success: boolean;
}

export interface DownloadResponse {
	data: Blob;
	filename?: string;
}

/**
 * 文件模块枚举
 */
export enum FileModuleCode {
	DEFAULT = "DEFAULT", // 默认模块
	USER_AVATAR = "USER_AVATAR", // 用户头像
	BUSINESS_DOC = "BUSINESS_DOC", // 业务相关文档
	TEMP = "TEMP", // 临时文件
}

/**
 * OSS 上传配置
 */
export interface OSSUploadOptions {
	file: File;
	moduleCode?: FileModuleCode | string;
	onProgress?: (percent: number, loadedBytes?: number, totalBytes?: number) => void;
	checksum?: string;
	signal?: AbortSignal;
}

/**
 * 获取预签名上传 URL 参数
 */
export interface GenerateUploadUrlParams {
	originalFileName: string;
	fileType?: string; // MIME 类型，默认 application/octet-stream
	fileSize?: number;
	moduleCode: FileModuleCode | string;
	checksum?: string; // 文件校验值 (SHA256 Base64)
}

/**
 * 获取预签名上传 URL 响应
 */
export interface GenerateUploadUrlResult {
	id: string | number;
	bucketName: string;
	fileName: string;
	originalFileName: string;
	uploadUrl: string; // OSS PUT 上传地址
	url: string; // 最终访问地址
	expires: number;
	pathPrefix: string;
}

export type OSSUploadResult = GenerateUploadUrlResult;

/**
 * 文件状态更新参数
 */
export interface UpdateFileStatusParams {
	fileId: string | number;
	fileIds?: (string | number)[];
	fileSize?: number;
	// 文件上传状态（枚举值）
	// 对应 FileStatusEnum.code
	// 可选值：INIT(初始化)、COMPLETED(上传完成)
	// 文件上传状态（枚举值）：INIT(初始化)、COMPLETED(上传完成)
	status: "COMPLETED";
}

// --- 辅助函数 ---

/**
 * 计算文件的 Base64 编码 MD5 校验和
 * 采用分片读取，防止大文件卡死 UI
 */
export const calculateFileChecksum = (file: File): Promise<string> => {
	return new Promise((resolve, reject) => {
		// 兼容不同浏览器的 slice 方法
		const blobSlice = File.prototype.slice || (File.prototype as any).mozSlice || (File.prototype as any).webkitSlice;
		const chunkSize = 2097152; // 2MB 分片大小
		const chunks = Math.ceil(file.size / chunkSize);
		let currentChunk = 0;

		const spark = new SparkMD5.ArrayBuffer();
		const fileReader = new FileReader();

		fileReader.onload = (e) => {
			if (!e.target?.result) {
				reject(new Error("Read file chunk failed"));
				return;
			}

			const arrayBuffer = e.target.result as ArrayBuffer;
			spark.append(arrayBuffer);

			currentChunk++;

			if (currentChunk < chunks) {
				loadNext();
			} else {
				// 获取十六进制 MD5
				const hexMD5 = spark.end();

				// 将十六进制字符串转换为字节数组
				const bytes = new Uint8Array(hexMD5.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []);

				// 将字节数组转换为 Base64
				let binary = "";
				for (let i = 0; i < bytes.length; i++) {
					binary += String.fromCharCode(bytes[i]);
				}
				const base64MD5 = btoa(binary);

				resolve(base64MD5);
			}
		};

		fileReader.onerror = () => {
			reject(new Error("File read error"));
		};

		function loadNext() {
			const start = currentChunk * chunkSize;
			const end = start + chunkSize >= file.size ? file.size : start + chunkSize;
			fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
		}

		loadNext();
	});
};

// --- UploadService 类 ---

export class UploadService {
	private instance: AxiosInstance;

	constructor(instance: AxiosInstance) {
		this.instance = instance;
	}

	// 内部辅助方法，模拟 ApiClient 的 post 行为（主要是日志和返回值处理）
	// 注意：假设传入的 instance 已经配置了拦截器来处理 response.data 的提取
	private async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
		console.debug("Executing UploadService POST request", {
			url,
			hasData: !!data,
		});
		const response = await this.instance.post<ApiResponse<T>>(url, data, config);
		// 假设拦截器已经将 response.data 替换为业务数据 T，或者我们需要自己解包
		// 根据原代码逻辑：return response.data as T;
		// 修正：apiClient 的拦截器已经返回了 data 字段（即业务数据 T），这里直接返回即可
		return response as unknown as T;
	}

	// PUT 请求
	async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
		console.debug("Executing PUT request", {
			url,
			hasData: !!data,
		});
		const response = await this.instance.put<ApiResponse<T>>(url, data, config);
		return response as unknown as T;
	}

	/**
	 * 上传文件请求
	 * 自动处理 FormData 的 Content-Type，确保 boundary 正确
	 */
	async upload<T = any>(url: string, data: FormData | any, config?: AxiosRequestConfig): Promise<T> {
		console.debug("Executing Upload request", { url });
		const response = await this.instance.post<ApiResponse<T>>(url, data, {
			...config,
			headers: {
				...config?.headers,
				// 当 data 为 FormData 时，设置为 undefined 让浏览器自动生成带 boundary 的 Content-Type
				"Content-Type": data instanceof FormData ? undefined : "multipart/form-data",
			},
		});
		// 修正：apiClient 的拦截器已经返回了 data 字段
		return response as unknown as T;
	}

	/**
	 * 导出/下载文件
	 * 1. 自动设置 responseType: 'blob'
	 * 2. 自动解析 Content-Disposition 中的文件名
	 *
	 * @param url 下载地址
	 * @param data 请求参数（有值则为 POST，无值则为 GET）
	 * @param config 其他配置
	 * @returns {Promise<DownloadResponse>} 包含 Blob 数据和文件名的对象
	 */
	async download(url: string, data?: any, config?: AxiosRequestConfig): Promise<DownloadResponse> {
		console.debug("Executing Download request", { url });

		const response = await this.instance.request({
			url,
			method: data ? "POST" : "GET",
			data: data,
			params: !data ? config?.params : undefined,
			...config,
			responseType: "blob", // 强制指定为 blob
		});

		// 解析文件名
		let filename: string | undefined;
		const contentDisposition = response.headers["content-disposition"];

		if (contentDisposition) {
			// 1. 优先尝试解析 RFC 5987 格式 (filename*=UTF-8''encoded_name)
			const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
			if (filenameStarMatch?.[1]) {
				filename = decodeURIComponent(filenameStarMatch[1]);
			} else {
				// 2. 降级解析常规格式 (filename="name" 或 filename=name)
				const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
				if (filenameMatch?.[1]) {
					filename = filenameMatch[1];
				}
			}
		}

		return {
			data: response.data,
			filename,
		};
	}

	/**
	 * 阿里云 OSS 文件上传（Presigned URL 模式）
	 * 流程：
	 * 1. 请求 /admin/sys-file/generate-upload-url 获取上传地址
	 * 2. 使用 PUT 方法直接上传文件到 OSS
	 * 3. 请求 /admin/sys-file/update 更新文件状态
	 */
	async uploadFile(options: OSSUploadOptions): Promise<OSSUploadResult> {
		let { file, moduleCode = FileModuleCode.DEFAULT, onProgress, checksum, signal } = options;
		const requestId = `UPLOAD_${Date.now()}_${file.name}`;

		console.info("Starting OSS upload sequence", {
			requestId,
			fileName: file.name,
			size: file.size,
			moduleCode,
		});

		// console.log("file===>", file);

		try {
			// 0. 如果没有提供 checksum，则自动计算
			if (!checksum) {
				console.debug("Step 0: Calculating file checksum", { requestId });
				const startTime = Date.now();
				checksum = await calculateFileChecksum(file);
				console.debug("Checksum calculated", {
					requestId,
					checksum,
					duration: Date.now() - startTime,
				});
			}

			// 1. 获取预签名上传地址
			console.debug("Step 1: Generating upload URL", { requestId });
			const genUrlParams: GenerateUploadUrlParams = {
				originalFileName: file.name,
				fileType: file.type || "application/octet-stream",
				fileSize: file.size,
				moduleCode,
				checksum, // 传递 Base64 SHA256
			};

			const genRes = await this.post<GenerateUploadUrlResult>("/admin/sys-file/generate-upload-url", genUrlParams);

			console.log("genRes=============>", genRes);

			if (!genRes || !genRes.uploadUrl) {
				throw new Error("Failed to generate upload URL");
			}

			console.debug("Step 1 Success", {
				requestId,
				fileId: genRes.id,
				uploadUrl: genRes.uploadUrl,
			});

			// 2. 上传文件到 OSS (使用原生 axios.put)
			console.debug("Step 2: Uploading to OSS", {
				requestId,
				uploadUrl: genRes.uploadUrl,
			});

			await axios.create().put(genRes.uploadUrl, file, {
				headers: {
					"Content-Type": getSmartContentType(file) || "application/octet-stream",
					// "x-amz-checksum-sha256": checksum,
					// "x-amz-sdk-checksum-algorithm": "SHA256",
				},
				signal,
				onUploadProgress: (progressEvent) => {
					if (onProgress) {
						const total = progressEvent.total;
						const loaded = progressEvent.loaded ?? 0;
						const percent = total && total > 0 ? Math.round((loaded * 100) / total) : 0;
						onProgress(percent, loaded, total);
					}
				},
			});

			console.debug("Step 2 Success", { requestId });

			// 3. 更新文件状态
			console.debug("Step 3: Updating file status", { requestId });
			const updateParams: UpdateFileStatusParams = {
				fileId: genRes.id,
				fileSize: file.size,
				status: "COMPLETED", // 假设成功状态为 COMPLETE，根据后端实际需求调整
			};

			await this.put("/admin/sys-file/update", updateParams);

			console.info("OSS upload sequence completed", {
				requestId,
				url: genRes.url,
			});

			return genRes;
		} catch (error) {
			console.error("OSS upload failed", error, { requestId });

			// 如果是在第二步之后失败，可能需要通知后端上传失败（可选）
			// await this.post('/admin/sys-file/update', { fileId: genRes.id, status: 'FAIL' });

			throw error;
		}
	}
}

export const uploadService = new UploadService(axiosInstance);
