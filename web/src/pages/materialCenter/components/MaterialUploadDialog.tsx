import { Button, Modal, message } from "antd";
import { useCallback, useRef, useState } from "react";
import { getRequestErrorMessage } from "@/pages/materialCenter/shared";
import { AppDyUpload, type AppDyUploadHandle } from "./AppDyUpload";

export type MaterialUploadDialogProps = {
	open: boolean;
	id?: number;
	isReUpload?: boolean;
	onOpenChange?: (open: boolean) => void;
	onSuccess?: () => void;
	onClose?: () => void;
};

export function MaterialUploadDialog({
	open,
	id = 0,
	isReUpload = false,
	onOpenChange,
	onSuccess,
	onClose,
}: MaterialUploadDialogProps) {
	const uploadRef = useRef<AppDyUploadHandle | null>(null);
	const [modal, contextHolder] = Modal.useModal();
	const [confirmLoading, setConfirmLoading] = useState(false);

	const emitClose = useCallback(() => {
		onOpenChange?.(false);
		onClose?.();
	}, [onClose, onOpenChange]);

	const handleCancelWithConfirm = useCallback(() => {
		modal.confirm({
			title: "提示",
			content: "确认取消吗？未保存的不会存储到数据库中",
			okText: "确定",
			cancelText: "取消",
			centered: true,
			onOk: emitClose,
		});
	}, [emitClose, modal]);

	const handleConfirm = useCallback(async () => {
		if (uploadRef.current && !uploadRef.current.hasUploadedFiles()) {
			message.warning("请上传视频");
			return;
		}
		try {
			setConfirmLoading(true);
			if (uploadRef.current) {
				const result = await uploadRef.current.submit();
				if (!result.proceeded) return;
				if (result.successCount > 0) {
					modal.success({
						title: "上传完成",
						content: `成功上传 ${result.successCount} 条视频`,
						centered: true,
					});
				}
				if (!result.allSucceeded) return;
				onOpenChange?.(false);
				onSuccess?.();
				return;
			}
			onOpenChange?.(false);
		} catch (error) {
			message.error(getRequestErrorMessage(error, "操作失败"));
		} finally {
			setConfirmLoading(false);
		}
	}, [modal, onOpenChange, onSuccess]);

	return (
		<div>
			{contextHolder}
			<Modal
				open={open}
				title={isReUpload ? "重新上传素材" : "批量上传素材"}
				width={"55%"}
				maskClosable={false}
				destroyOnHidden
				onCancel={handleCancelWithConfirm}
				footer={[
					<Button key="cancel" size="middle" onClick={handleCancelWithConfirm} disabled={confirmLoading}>
						取消
					</Button>,
					<Button key="ok" type="primary" size="middle" loading={confirmLoading} onClick={() => void handleConfirm()}>
						确定
					</Button>,
				]}
			>
				<div className="mt-2">
					<AppDyUpload ref={uploadRef} id={id} isReUpload={isReUpload} manualSave />
				</div>
			</Modal>
		</div>
	);
}

export default MaterialUploadDialog;
