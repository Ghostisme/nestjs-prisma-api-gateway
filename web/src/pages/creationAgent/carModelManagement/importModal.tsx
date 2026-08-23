import { App, Button, Modal, Upload } from "antd";
import { useState } from "react";
import { batchImportCarModel, downloadSellingTemplate } from "@/api/creationAgent";
import { Icon } from "@/components/icon";

const { Dragger } = Upload;

export default ({ visible, onClose, onRefresh }: Props) => {
	const { message } = App.useApp();
	const [uploading, setUploading] = useState(false);
	const [downloading, setDownloading] = useState(false);

	const handleUpload = async (file: File) => {
		try {
			setUploading(true);
			await batchImportCarModel(file);
			message.success("导入成功");
			onRefresh?.();
			onClose();
		} catch (error: any) {
			console.error("Import error:", error);
			message.error(error.message || "导入失败");
		} finally {
			setUploading(false);
		}
		return false; // 阻止默认上传行为
	};

	const handleDownloadTemplate = async () => {
		try {
			setDownloading(true);
			const { data: blob, filename } = await downloadSellingTemplate();

			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = filename || "导入模板.xlsx";

			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
			message.success("模板下载成功");
		} catch (error: any) {
			console.error("Download template error:", error);
			message.error(error.message || "模板下载失败");
		} finally {
			setDownloading(false);
		}
	};

	return (
		<Modal open={visible} destroyOnHidden width={480} onCancel={onClose} title={"批量导入"} footer={null}>
			<div className="flex flex-col gap-6 py-4">
				{/* 下载模板区域 */}
				<div className="bg-[#F0F5FF] rounded-xl p-4 flex items-center justify-between">
					<div className="flex flex-col">
						<span className="text-sm font-medium text-[#1677FF]">第一步：获取模板</span>
						<span className="text-xs text-[#1677FF]/70 mt-1">请下载标准模板，按格式填写数据</span>
					</div>
					<Button
						type="primary"
						shape="round"
						icon={<Icon icon="mdi:download" />}
						loading={downloading}
						onClick={handleDownloadTemplate}
					>
						下载模板
					</Button>
				</div>

				{/* 上传文件区域 */}
				<div className="flex flex-col gap-2">
					<span className="text-sm font-medium text-gray-700">第二步：上传文件</span>
					<Dragger
						beforeUpload={handleUpload}
						showUploadList={false}
						accept=".xlsx,.xls"
						disabled={uploading}
						style={{ borderRadius: "12px", border: "1px dashed #d9d9d9", background: "#fafafa" }}
					>
						<div className="py-6 flex flex-col items-center justify-center">
							<Icon icon="mdi:cloud-upload-outline" size={40} color={uploading ? "#999" : "#1677ff"} />
							<p className="text-sm font-medium text-gray-700 mt-3">
								{uploading ? "正在导入中..." : "点击或将文件拖拽到这里上传"}
							</p>
							<p className="text-xs text-gray-400 mt-1">支持 .xlsx, .xls 格式文件</p>
						</div>
					</Dragger>
				</div>
			</div>
		</Modal>
	);
};

interface Props {
	visible: boolean;
	onClose(): void;
	onRefresh?(): void;
}
