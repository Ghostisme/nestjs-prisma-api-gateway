import { Button, Modal, message, Progress, Upload } from "antd";
import { useState } from "react";
import SparkMD5 from "spark-md5";
import { rawMaterialService } from "@/api/creationAgent";
import { Icon } from "@/components/icon";

const { Dragger } = Upload;

export interface RawMaterialUploadDialogProps {
	open: boolean;
	parentId: number;
	onClose: () => void;
	onSuccess: () => void;
}

export function RawMaterialUploadDialog({ open, parentId, onClose, onSuccess }: RawMaterialUploadDialogProps) {
	const [fileList, setFileList] = useState<any[]>([]);
	const [uploading, setUploading] = useState(false);
	const [progress, setProgress] = useState(0);

	const calcFileMd5 = (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = (e) => {
				const buffer = e.target?.result as ArrayBuffer;
				const spark = new SparkMD5.ArrayBuffer();
				spark.append(buffer);
				resolve(spark.end());
			};
			reader.onerror = () => reject(new Error("读取文件失败"));
			reader.readAsArrayBuffer(file);
		});
	};

	const handleUpload = async () => {
		if (fileList.length === 0) {
			message.warning("请先选择文件");
			return;
		}

		setUploading(true);
		setProgress(0);

		try {
			for (const fileObj of fileList) {
				const file = (fileObj.originFileObj || fileObj) as File;

				// 1. 计算 MD5
				const md5 = await calcFileMd5(file);

				// 2. 获取预签名 URL
				const presignedRes = await rawMaterialService.getPresignedUrl({
					md5,
					filename: file.name,
					size: file.size,
				});

				const { existed, objectKey, presignedUrl } = presignedRes;

				if (!existed && presignedUrl) {
					// 3. 上传到 OSS
					await new Promise<void>((resolve, reject) => {
						const xhr = new XMLHttpRequest();
						xhr.upload.addEventListener("progress", (e) => {
							if (e.lengthComputable) {
								setProgress(Math.round((e.loaded / e.total) * 100));
							}
						});
						xhr.addEventListener("load", () => {
							if (xhr.status === 200) {
								resolve();
							} else {
								reject(new Error(`OSS上传失败: ${xhr.status}`));
							}
						});
						xhr.addEventListener("error", () => reject(new Error("网络错误")));
						xhr.open("PUT", presignedUrl);
						xhr.setRequestHeader("Content-Type", "application/octet-stream");
						xhr.send(file);
					});
				} else {
					setProgress(100);
				}

				// 4. 登记原料
				await rawMaterialService.createAsset({
					parentId,
					name: file.name,
					md5,
					storageKey: objectKey,
					mediaType: file.type.startsWith("image/") ? "image" : "video",
					sizeBytes: file.size,
				});
			}

			message.success("上传成功");
			setFileList([]);
			onSuccess();
			onClose();
		} catch (error: any) {
			message.error(error.message || "上传失败");
		} finally {
			setUploading(false);
			setProgress(0);
		}
	};

	const uploadProps = {
		onRemove: (file: any) => {
			setFileList((prev) => prev.filter((item) => item.uid !== file.uid));
		},
		beforeUpload: (file: any) => {
			setFileList((prev) => [...prev, file]);
			return false; // 阻止自动上传
		},
		fileList,
		multiple: true,
	};

	return (
		<Modal
			title="上传原料"
			open={open}
			onCancel={onClose}
			footer={[
				<Button key="cancel" onClick={onClose} disabled={uploading}>
					取消
				</Button>,
				<Button key="submit" type="primary" loading={uploading} onClick={handleUpload} disabled={fileList.length === 0}>
					{uploading ? "上传中" : "开始上传"}
				</Button>,
			]}
		>
			<Dragger {...uploadProps} disabled={uploading}>
				<p className="ant-upload-drag-icon text-4xl text-(--ant-color-primary) flex justify-center">
					<Icon icon="solar:inbox-in-bold" />
				</p>
				<p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
				<p className="ant-upload-hint">支持单个或批量上传视频和图片文件</p>
			</Dragger>
			{uploading && (
				<div className="mt-4">
					<Progress percent={progress} />
				</div>
			)}
		</Modal>
	);
}
